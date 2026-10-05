/**
 * Handler de mensajes: pequeño a proposito.
 * Solo orquesta -> serializar, actualizar BD, XP, protecciones, resolver
 * comando, pasar la cadena de middlewares y ejecutar.
 * Toda la logica concreta vive en lib/ y middleware/.
 */
import config, { isOwnerNumber, COMMON_PREFIXES } from './config.js'
import logger from './lib/logger.js'
import serialize from './lib/serialize.js'
import registry from './lib/loader.js'
import runMiddlewares from './middleware/index.js'
import runGuards from './lib/guards.js'
import { handleGameMessage } from './lib/games.js'
import { getMetadata, isAdmin as checkAdmin } from './lib/group.js'
import { addXp } from './lib/levelling.js'
import { isExpectedError } from './lib/errors.js'
import { randomInt } from './lib/functions.js'
import {
  getUser, getGroup, getPrefix, getMode, addLimit, trackCommand, db, userKey
} from './database/index.js'

/** XP que se otorga por mensaje (con pequeño factor aleatorio). */
const XP_PER_MESSAGE = () => randomInt(2, 8)

/** Escapa un texto para usarlo dentro de una expresion regular. */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Prefijos aceptados: el configurado y, salvo que MULTI_PREFIX=false, los
 * habituales. Asi un prefijo mal escrito nunca deja al bot sin responder.
 * @returns {string[]} ordenados del mas largo al mas corto
 */
export function prefixList (prefix) {
  const list = [prefix]
  if (config.multiPrefix) {
    for (const alternative of COMMON_PREFIXES) {
      if (!list.includes(alternative)) list.push(alternative)
    }
  }
  return list.filter(Boolean).sort((a, b) => b.length - a.length)
}

/**
 * Detecta el prefijo usado y separa comando y argumentos.
 * Acepta tambien el id devuelto por un boton (que ya es un comando completo).
 * @param {string} body
 * @param {string|string[]} prefixes prefijo configurado o lista de aceptados
 */
export function parseCommand (body, prefixes) {
  const text = String(body || '').trim()
  if (!text) return null
  const list = Array.isArray(prefixes) ? prefixes : [prefixes]
  for (const prefix of list) {
    if (!prefix) continue
    const pattern = new RegExp(`^(${escapeRegex(prefix)})\\s*([^\\s]+)\\s*([\\s\\S]*)$`)
    const match = text.match(pattern)
    if (!match) continue
    return {
      usedPrefix: match[1],
      name: match[2].toLowerCase(),
      text: (match[3] || '').trim(),
      args: (match[3] || '').trim().split(/\s+/).filter(Boolean)
    }
  }
  return null
}

/**
 * Crea el manejador de mensajes entrantes.
 * @param {{ startedAt: number }} runtime
 */
export function createHandler (runtime) {
  return async function handleMessages (sock, update) {
    const messages = update?.messages || []
    for (const raw of messages) {
      try {
        await handleOne(sock, raw, runtime)
      } catch (error) {
        // Red de seguridad: ningun mensaje puede tumbar el bot.
        logger.error({ err: error.message, stack: error.stack }, 'error no controlado en el handler')
      }
    }
  }
}

async function handleOne (sock, raw, runtime) {
  if (!raw?.message) return
  const m = serialize(sock, raw)
  if (!m || m.isStatus) return
  if (m.type === 'protocolMessage' || m.type === 'reactionMessage' || m.type === 'senderKeyDistributionMessage') return
  // Los mensajes propios SÍ se procesan: así el dueño puede usar el bot desde
  // el mismo teléfono donde está vinculado. Lo único que se descarta es el eco
  // de lo que ha enviado el propio bot (evita cualquier bucle).
  if (m.fromMe && sock.isSelfSent?.(m.id)) return
  if (m.isGroup && !config.enableGroups) return

  /* ─── Base de datos ─── */
  const user = getUser(m.sender, m.pushName)
  try {
    user.messages = (user.messages || 0) + 1
    db.data.stats.messages = (db.data.stats.messages || 0) + 1
  } catch (error) {
    // Un fallo contando mensajes jamas debe impedir que el comando se ejecute.
    logger.warn({ err: error.message }, 'no se pudieron actualizar las estadisticas')
  }

  let group = null
  let metadata = null
  if (m.isGroup) {
    metadata = await getMetadata(sock, m.chat)
    group = getGroup(m.chat, metadata?.subject || '')
  }

  /* ─── XP por actividad ─── */
  let xpResult = { leveledUp: false }
  try {
    xpResult = addXp(user, XP_PER_MESSAGE())
    db.data.users[user.id].xp = user.xp
    db.data.users[user.id].level = user.level
    db.data.users[user.id].messages = user.messages
    db.markDirty()
  } catch (error) {
    logger.warn({ err: error.message }, 'no se pudo otorgar XP')
  }

  /* ─── Permisos de contexto ─── */
  const isOwner = isOwnerNumber(m.sender) || m.fromMe
  const isAdmin = m.isGroup ? checkAdmin(metadata, m.sender) : false
  const isBotAdmin = m.isGroup ? checkAdmin(metadata, m.botJid) : false

  const prefix = getPrefix()
  const prefixes = prefixList(prefix)
  const settings = { ...db.settings, prefix, mode: getMode() }

  const baseCtx = {
    sock, m, user, group, metadata, settings, prefix,
    isOwner, isAdmin, isBotAdmin, registry, runtime
  }

  /* ─── Protecciones de grupo (antilink...) ─── */
  if (!(await runGuards(baseCtx))) return

  /* ─── Resolver comando ─── */
  // El id de un boton ya viene con prefijo y se trata como texto normal.
  const body = m.buttonId || m.body
  const parsed = parseCommand(body, prefixes)
  const command = parsed ? registry.resolve(parsed.name) : null

  logger.debug({
    chat: m.isGroup ? 'grupo' : 'privado',
    de: m.senderNumber,
    propio: m.fromMe,
    tipo: m.type,
    prefijo: prefix,
    texto: String(body || '').slice(0, 40),
    comando: command?.name || parsed?.name || null
  }, 'mensaje recibido')

  /* ─── Juegos activos: sus respuestas no llevan prefijo ─── */
  // Se consultan DESPUES de resolver el comando: asi un .menu siempre
  // funciona aunque haya una partida a medias en el chat.
  if (!command && await handleGameMessage(baseCtx)) return

  /* ─── Aviso de subida de nivel ─── */
  if (xpResult.leveledUp && m.isGroup) {
    await sock.sendMessage(m.chat, {
      text: `🎉 ¡Felicidades @${m.senderNumber}! Has subido al *nivel ${user.level}* ★`,
      mentions: [m.sender]
    }).catch(() => {})
  }

  if (!command) {
    if (parsed) logger.debug({ intento: parsed.name }, 'no existe ningun comando con ese nombre')
    return
  }

  if (config.autoRead) await sock.readMessages([m.key]).catch(() => {})

  const ctx = {
    ...baseCtx,
    command,
    args: parsed.args,
    text: parsed.text,
    usedPrefix: parsed.usedPrefix,
    commandName: parsed.name
  }

  /* ─── Middlewares (permisos, args, limites, cooldown...) ─── */
  let allowed = false
  try {
    allowed = await runMiddlewares(ctx)
  } catch (error) {
    logger.error({ err: error.message, command: command.name }, 'fallo en los middlewares')
    return
  }
  if (!allowed) return

  /* ─── Ejecucion aislada ─── */
  const started = Date.now()
  try {
    await command.exec(ctx)
    trackCommand(command.name, user)
    logger.info(
      { comando: command.name, usuario: user.id, ms: Date.now() - started, chat: m.isGroup ? 'grupo' : 'privado' },
      'comando ejecutado'
    )
  } catch (error) {
    // Se devuelve el limite consumido: el usuario no pago por un fallo nuestro.
    if (ctx.limitUsed) addLimit(user, ctx.limitUsed)

    if (isExpectedError(error)) {
      await m.reply(error.message).catch(() => {})
      return
    }

    logger.error(
      { comando: command.name, err: error.message, stack: error.stack },
      'error ejecutando el comando'
    )
    await m.reply(
      `❌ Ocurrió un error al ejecutar *${command.name}*.\n` +
      '_El incidente quedó registrado. Inténtalo de nuevo más tarde._'
    ).catch(() => {})
  }
}

export default createHandler
