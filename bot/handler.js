/**
 * Handler de mensajes: pequeño a proposito.
 * Solo orquesta -> serializar, actualizar BD, XP, protecciones, resolver
 * comando, pasar la cadena de middlewares y ejecutar.
 * Toda la logica concreta vive en lib/ y middleware/.
 */
import config from './config.js'
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
 * Detecta el prefijo usado y separa comando y argumentos.
 * Acepta tambien el id devuelto por un boton (que ya es un comando completo).
 */
export function parseCommand (body, prefix) {
  const text = String(body || '').trim()
  if (!text) return null
  const pattern = new RegExp(`^(${escapeRegex(prefix)})\\s*([^\\s]+)\\s*([\\s\\S]*)$`)
  const match = text.match(pattern)
  if (!match) return null
  return {
    usedPrefix: match[1],
    name: match[2].toLowerCase(),
    text: (match[3] || '').trim(),
    args: (match[3] || '').trim().split(/\s+/).filter(Boolean)
  }
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
  // Los mensajes propios SÍ se procesan: permiten usar el bot desde su propio
  // teléfono (se tratan como owner). Las respuestas del bot nunca empiezan por
  // el prefijo, así que no hay bucles.
  if (m.isGroup && !config.enableGroups) return

  /* ─── Base de datos ─── */
  const user = getUser(m.sender, m.pushName)
  user.messages = (user.messages || 0) + 1
  db.data.stats.messages = (db.data.stats.messages || 0) + 1

  let group = null
  let metadata = null
  if (m.isGroup) {
    metadata = await getMetadata(sock, m.chat)
    group = getGroup(m.chat, metadata?.subject || '')
  }

  /* ─── XP por actividad ─── */
  const xpResult = addXp(user, XP_PER_MESSAGE())
  db.data.users[user.id].xp = user.xp
  db.data.users[user.id].level = user.level
  db.data.users[user.id].messages = user.messages
  db.markDirty()

  /* ─── Permisos de contexto ─── */
  const isOwner = config.ownerNumbers.includes(userKey(m.sender)) || m.fromMe
  const isAdmin = m.isGroup ? checkAdmin(metadata, m.sender) : false
  const isBotAdmin = m.isGroup ? checkAdmin(metadata, m.botJid) : false

  const prefix = getPrefix()
  const settings = { ...db.settings, prefix, mode: getMode() }

  const baseCtx = {
    sock, m, user, group, metadata, settings, prefix,
    isOwner, isAdmin, isBotAdmin, registry, runtime
  }

  /* ─── Protecciones de grupo (antilink...) ─── */
  if (!(await runGuards(baseCtx))) return

  /* ─── Juegos activos: sus respuestas no llevan prefijo ─── */
  if (await handleGameMessage(baseCtx)) return

  /* ─── Aviso de subida de nivel ─── */
  if (xpResult.leveledUp && m.isGroup) {
    await sock.sendMessage(m.chat, {
      text: `🎉 ¡Felicidades @${m.senderNumber}! Has subido al *nivel ${user.level}* ★`,
      mentions: [m.sender]
    }).catch(() => {})
  }

  /* ─── Resolver comando ─── */
  // El id de un boton ya viene con prefijo y se trata como texto normal.
  const body = m.buttonId || m.body
  const parsed = parseCommand(body, prefix)
  if (!parsed) return

  const command = registry.resolve(parsed.name)
  if (!command) return

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
