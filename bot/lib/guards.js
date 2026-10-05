/**
 * Protecciones automaticas de grupo que se evaluan antes de los comandos.
 * Hoy: antilink. Añadir una nueva es tan simple como crear otra funcion y
 * registrarla en GUARDS.
 */
import logger from './logger.js'

const LINK_REGEX = /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/i

/** Expulsa (si puede) a quien envie enlaces de invitacion de grupos. */
async function antilink (ctx) {
  const { m, sock, group, isAdmin, isOwner, isBotAdmin } = ctx
  if (!m.isGroup || !group?.antilink) return true
  if (!LINK_REGEX.test(m.body || '')) return true
  if (isAdmin || isOwner || m.fromMe) return true

  await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {})

  if (!isBotAdmin) {
    await sock.sendMessage(m.chat, {
      text: `🔗 @${m.senderNumber} está enviando enlaces de invitación.\n_No puedo actuar porque no soy administrador._`,
      mentions: [m.sender]
    }).catch(() => {})
    return false
  }

  await sock.sendMessage(m.chat, {
    text: `🚫 @${m.senderNumber} ha sido expulsado por enviar enlaces de invitación.`,
    mentions: [m.sender]
  }).catch(() => {})
  await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch((error) => {
    logger.warn({ err: error.message }, 'antilink: no se pudo expulsar')
  })
  return false
}

const GUARDS = [antilink]

/** @returns {Promise<boolean>} false si el mensaje ya fue gestionado y hay que parar. */
export async function runGuards (ctx) {
  for (const guard of GUARDS) {
    try {
      const keepGoing = await guard(ctx)
      if (!keepGoing) return false
    } catch (error) {
      logger.error({ err: error.message }, 'fallo en una protección de grupo')
    }
  }
  return true
}

export default runGuards
