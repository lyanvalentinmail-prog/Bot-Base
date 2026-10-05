/** Enfriamiento por usuario para evitar spam. El owner queda exento. */
import config from '../config.js'
import cooldowns from '../lib/cooldown.js'
import { timeLeft } from '../lib/functions.js'

export default async function cooldown (ctx) {
  const { command, user, m, isOwner } = ctx
  if (isOwner) return true

  const seconds = command.cooldown ?? config.cooldown
  if (!seconds) return true

  const remaining = cooldowns.check(user.id, command.name, seconds)
  if (remaining > 0) {
    await m.react('🕒')
    return false
  }

  cooldowns.set(user.id, command.name, seconds)
  ctx.cooldownApplied = { user: user.id, command: command.name }
  void timeLeft
  return true
}
