/** Modo publico/privado y grupos silenciados. */
import config from '../config.js'
import logger from '../lib/logger.js'

let lockoutWarned = false

export default async function mode (ctx) {
  const { isOwner, settings, group, m } = ctx

  if (settings.mode === 'private' && !isOwner) {
    // Sin OWNER_NUMBER, el modo privado dejaria al bot mudo para TODO el mundo
    // (incluido quien lo administra): se ignora y se avisa una sola vez.
    if (!config.ownerNumbers.length) {
      if (!lockoutWarned) {
        lockoutWarned = true
        logger.warn('modo privado sin OWNER_NUMBER configurado: se responde como publico para no bloquear el bot')
      }
    } else {
      return false
    }
  }

  // Grupo silenciado con .mute (solo admins y owner pueden usarlo)
  if (group?.mute && !isOwner && !ctx.isAdmin) return false

  // Nunca responder a mensajes de estado
  if (m.isStatus) return false

  return true
}
