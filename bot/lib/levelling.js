/**
 * Sistema de XP y niveles.
 * Curva: XP necesaria para pasar del nivel N al N+1 = 100 + (N-1) * 75
 */
export const BASE_XP = 100
export const STEP_XP = 75

export const xpForLevel = (level) => BASE_XP + Math.max(0, level - 1) * STEP_XP

/** XP acumulada necesaria para alcanzar un nivel. */
export function totalXpForLevel (level) {
  let total = 0
  for (let i = 1; i < level; i++) total += xpForLevel(i)
  return total
}

/** @returns {boolean} true si el usuario tiene XP suficiente para subir. */
export const canLevelUp = (user) => user.xp >= xpForLevel(user.level)

/**
 * Añade XP y procesa las subidas de nivel.
 * @returns {{ leveledUp: boolean, levels: number, level: number, xp: number, needed: number }}
 */
export function addXp (user, amount) {
  user.xp = Math.max(0, (user.xp || 0) + amount)
  let levels = 0
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level)
    user.level += 1
    levels += 1
  }
  return {
    leveledUp: levels > 0,
    levels,
    level: user.level,
    xp: user.xp,
    needed: xpForLevel(user.level)
  }
}

/** Rango segun el nivel. */
export function rankOf (level) {
  if (level >= 100) return '👑 Leyenda'
  if (level >= 75) return '💎 Maestro'
  if (level >= 50) return '🔥 Élite'
  if (level >= 35) return '⚔️ Veterano'
  if (level >= 20) return '🛡️ Guerrero'
  if (level >= 10) return '🌟 Aventurero'
  if (level >= 5) return '🍀 Aprendiz'
  return '🥚 Novato'
}

export default { addXp, xpForLevel, totalXpForLevel, canLevelUp, rankOf }
