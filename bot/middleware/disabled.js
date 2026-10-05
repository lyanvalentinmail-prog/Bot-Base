/** Comandos deshabilitados globalmente o en el grupo. */
import { isCommandDisabled } from '../database/index.js'

export default async function disabled (ctx) {
  const { command, isOwner, m, group } = ctx
  if (isOwner) return true
  if (!isCommandDisabled(command.name, group?.id)) return true
  await m.reply(`🚫 El comando *${command.name}* está desactivado.`)
  return false
}
