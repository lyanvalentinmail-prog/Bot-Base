/**
 * Limites diarios (Ⓛ). Los premium y el owner no consumen limite.
 * Si el comando falla con un error inesperado, el handler devuelve el limite.
 */
import config from '../config.js'
import { useLimit } from '../database/index.js'

export default async function limit (ctx) {
  const { command, user, m, isOwner } = ctx
  if (!command.limit || isOwner || user.premium) return true

  const cost = typeof command.limit === 'number' ? command.limit : 1

  if (!useLimit(user, cost)) {
    await m.reply(
      `Ⓛ Te has quedado sin límites por hoy.\n\n` +
      `♻️ Se reinician cada día a las 00:00 UTC (${config.defaultLimit} por día).\n` +
      `Ⓟ Los usuarios premium tienen ${config.premiumLimit}.`
    )
    return false
  }

  ctx.limitUsed = cost
  return true
}
