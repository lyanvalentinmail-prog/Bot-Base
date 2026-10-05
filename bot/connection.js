/**
 * Conexion con WhatsApp mediante Baileys: emparejamiento por Pairing Code,
 * sesion persistente en ./sessions y reconexion automatica con reintentos.
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import NodeCache from 'node-cache'
import { Boom } from '@hapi/boom'
import makeWASocket, {
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  jidNormalizedUser,
  delay
} from 'baileys'

import config, { onlyDigits } from './config.js'
import logger, { waLogger } from './lib/logger.js'
import { getGroup, db } from './database/index.js'
import { getMetadata, invalidate } from './lib/group.js'

const msgRetryCounterCache = new NodeCache({ stdTTL: 300, checkperiod: 60 })

/** Número para el emparejamiento: se pregunta una sola vez aunque haya reconexiones. */
let pairingNumberCache = ''

/** Estado compartido de la conexion (lo usan comandos como .restart o .broadcast). */
export const state = {
  sock: null,
  startedAt: Date.now(),
  connectedAt: 0,
  status: 'Iniciando',
  reconnects: 0
}

/** Pregunta el numero por consola (o lo toma de PAIRING_NUMBER). */
async function askPhoneNumber () {
  if (config.pairingNumber) return config.pairingNumber
  if (config.ownerNumbers.length && process.env.USE_OWNER_NUMBER === 'true') return config.ownerNumbers[0]

  if (!input.isTTY) {
    throw new Error(
      'No hay terminal interactiva. Define PAIRING_NUMBER en el .env con el número del bot ' +
      '(formato internacional, solo dígitos) y vuelve a ejecutar.'
    )
  }

  const rl = readline.createInterface({ input, output })
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const answer = await rl.question('\n📱 Escribe el número de WhatsApp del BOT (formato internacional, sin + ni espacios)\n   Ejemplo: 5215512345678\n   › ')
      const number = onlyDigits(answer)
      if (number.length >= 8 && number.length <= 16) return number
      console.log('⚠️  Número no válido. Debe tener entre 8 y 16 dígitos, sin + ni espacios.')
    }
    throw new Error('Número no válido tras 3 intentos.')
  } finally {
    rl.close()
  }
}

/** Imprime el Pairing Code bien visible en la terminal. */
function printPairingCode (code) {
  const pretty = code?.match(/.{1,4}/g)?.join('-') || code
  const line = '═'.repeat(44)
  console.log(`\n╔${line}╗`)
  console.log(`║  🔗 CÓDIGO DE VINCULACIÓN (Pairing Code)   ║`)
  console.log(`║                                            ║`)
  console.log(`║              ${pretty.padEnd(30)}║`)
  console.log(`║                                            ║`)
  console.log(`║  WhatsApp › Dispositivos vinculados ›      ║`)
  console.log(`║  Vincular dispositivo ›                    ║`)
  console.log(`║  "Vincular con el número de teléfono"      ║`)
  console.log(`╚${line}╝`)
  console.log('⏳ El código caduca en unos minutos. Si expira, reinicia con: npm start\n')
}

/**
 * Arranca (o rearranca) la conexion.
 * @param {(sock: import('baileys').WASocket, update: object) => Promise<void>} onMessages
 */
export async function connect (onMessages) {
  await fsp.mkdir(config.paths.sessions, { recursive: true })

  const { state: authState, saveCreds } = await useMultiFileAuthState(config.paths.sessions)
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined, isLatest: false }))
  if (version) logger.info({ version: version.join('.'), ultima: isLatest }, 'versión del protocolo de WhatsApp')

  const sock = makeWASocket({
    version,
    logger: waLogger,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, waLogger)
    },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
    retryRequestDelayMs: 2_000,
    getMessage: async () => undefined
  })

  state.sock = sock

  /* ─── Pairing Code ───
   * El número se pide una sola vez por ejecución y el código se solicita
   * cuando el socket ya está listo (WhatsApp emite un "qr" en ese momento),
   * reintentando si la conexión aún no está estable.
   */
  let pairingRequested = false
  if (!sock.authState.creds.registered && !pairingNumberCache) {
    pairingNumberCache = await askPhoneNumber()
  }

  /** Red de seguridad: si no llega el evento "qr", se pide el código igualmente. */
  const pairingFallback = setTimeout(() => {
    if (!sock.authState.creds.registered) requestPairing().catch(() => {})
  }, 10_000)
  pairingFallback.unref?.()

  const requestPairing = async () => {
    if (pairingRequested || sock.authState.creds.registered) return
    pairingRequested = true
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await delay(attempt === 1 ? 2000 : 4000)
        const code = await sock.requestPairingCode(pairingNumberCache)
        clearTimeout(pairingFallback)
        printPairingCode(code)
        return
      } catch (error) {
        logger.warn({ intento: attempt, err: error.message }, 'no se pudo solicitar el Pairing Code')
        if (attempt === 3) {
          console.log('\n❌ No se pudo obtener el Pairing Code. Comprueba tu conexión a internet y vuelve a ejecutar `npm start`.\n')
          pairingRequested = false
        }
      }
    }
  }

  sock.ev.on('creds.update', saveCreds)

  /* ─── Mensajes ─── */
  sock.ev.on('messages.upsert', async (update) => {
    // Solo "notify": "append" son mensajes que el propio bot acaba de enviar.
    if (update.type !== 'notify') return
    try {
      await onMessages(sock, update)
    } catch (error) {
      logger.error({ err: error.message }, 'fallo procesando mensajes')
    }
  })

  /* ─── Grupos: cache de metadatos y bienvenidas ─── */
  sock.ev.on('groups.update', ([event]) => { if (event?.id) invalidate(event.id) })

  sock.ev.on('group-participants.update', async (event) => {
    invalidate(event.id)
    try {
      const group = getGroup(event.id)
      if (!group.welcome) return
      const metadata = await getMetadata(sock, event.id, true)
      for (const participant of event.participants) {
        const tag = `@${participant.split('@')[0]}`
        if (event.action === 'add') {
          const text = (group.welcomeText || `👋 ¡Bienvenido ${tag} a *${metadata?.subject || 'el grupo'}*!`)
            .replace(/@user/gi, tag)
            .replace(/@group/gi, metadata?.subject || '')
          await sock.sendMessage(event.id, { text, mentions: [participant] })
        } else if (event.action === 'remove') {
          const text = (group.byeText || `👋 ${tag} salió del grupo.`)
            .replace(/@user/gi, tag)
            .replace(/@group/gi, metadata?.subject || '')
          await sock.sendMessage(event.id, { text, mentions: [participant] })
        }
      }
    } catch (error) {
      logger.warn({ err: error.message }, 'fallo en el mensaje de bienvenida/despedida')
    }
  })

  /* ─── Llamadas: se rechazan para no bloquear el bot ─── */
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      if (call.status !== 'offer') continue
      await sock.rejectCall(call.id, call.from).catch(() => {})
      await sock.sendMessage(call.from, {
        text: '📵 Las llamadas no están permitidas. Usa comandos de texto, por favor.'
      }).catch(() => {})
    }
  })

  /* ─── Ciclo de conexion ─── */
  return new Promise((resolve, reject) => {
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      // Cuando llega un QR el socket ya está listo: es el momento de pedir el código.
      if (qr && !sock.authState.creds.registered) {
        logger.debug('socket listo, solicitando Pairing Code')
        requestPairing().catch((error) => logger.error({ err: error.message }, 'fallo al emparejar'))
      }

      if (connection === 'connecting') {
        state.status = 'Conectando'
        logger.info('conectando con WhatsApp...')
      }

      if (connection === 'open') {
        state.status = 'Activo'
        state.connectedAt = Date.now()
        state.reconnects = 0
        const me = jidNormalizedUser(sock.user?.id || '')
        logger.info({ numero: me.split('@')[0], nombre: sock.user?.name }, '✅ conectado a WhatsApp')
        console.log(`\n✅ *${config.botName}* conectado como ${sock.user?.name || me.split('@')[0]}`)
        console.log(`   Prefijo: ${db.settings.prefix}   ·   Modo: ${db.settings.mode}\n`)
        resolve(sock)
      }

      if (connection === 'close') {
        state.status = 'Desconectado'
        clearTimeout(pairingFallback)
        const boom = lastDisconnect?.error instanceof Boom ? lastDisconnect.error : new Boom(lastDisconnect?.error)
        const statusCode = boom?.output?.statusCode

        const reasons = {
          [DisconnectReason.badSession]: 'sesión corrupta',
          [DisconnectReason.connectionClosed]: 'conexión cerrada',
          [DisconnectReason.connectionLost]: 'conexión perdida',
          [DisconnectReason.connectionReplaced]: 'sesión abierta en otro lugar',
          [DisconnectReason.loggedOut]: 'sesión cerrada desde el teléfono',
          [DisconnectReason.restartRequired]: 'reinicio requerido',
          [DisconnectReason.timedOut]: 'tiempo de espera agotado',
          [DisconnectReason.multideviceMismatch]: 'desajuste multidispositivo'
        }
        logger.warn({ statusCode, motivo: reasons[statusCode] || 'desconocido' }, 'conexión cerrada')

        if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession) {
          console.log('\n🔐 La sesión ya no es válida. Ejecuta: npm run reset-session && npm start\n')
          reject(new Error('sesión no válida'))
          return
        }

        if (statusCode === DisconnectReason.connectionReplaced) {
          console.log('\n⚠️  Se abrió otra sesión con este número. Cierra la otra instancia y vuelve a iniciar.\n')
          reject(new Error('sesión reemplazada'))
          return
        }

        // Reconexion con espera progresiva (max 30 s)
        state.reconnects += 1
        const wait = Math.min(30_000, 2_000 * state.reconnects)
        logger.info({ intento: state.reconnects, esperaMs: wait }, 'reconectando...')
        await delay(wait)
        connect(onMessages).then(resolve).catch(reject)
      }
    })
  })
}

/** Borra la carpeta de sesion (usado por scripts/reset-session.js). */
export async function clearSession () {
  if (fs.existsSync(config.paths.sessions)) {
    await fsp.rm(config.paths.sessions, { recursive: true, force: true })
    return true
  }
  return false
}

export default connect
