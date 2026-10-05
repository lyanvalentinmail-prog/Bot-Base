/**
 * Control de enfriamiento (anti-spam) por usuario y comando.
 */
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 120, checkperiod: 60, useClones: false })

/**
 * @returns {number} milisegundos restantes (0 si puede ejecutar)
 */
export function check (userId, commandName, seconds) {
  if (!seconds || seconds <= 0) return 0
  const key = `${userId}:${commandName}`
  const until = cache.get(key)
  if (until && until > Date.now()) return until - Date.now()
  return 0
}

export function set (userId, commandName, seconds) {
  if (!seconds || seconds <= 0) return
  const key = `${userId}:${commandName}`
  cache.set(key, Date.now() + seconds * 1000, Math.ceil(seconds) + 5)
}

export function clear (userId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) cache.del(key)
  }
}

export default { check, set, clear }
