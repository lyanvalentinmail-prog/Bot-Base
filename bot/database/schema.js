/**
 * Esquemas por defecto de la base de datos.
 * Cualquier campo nuevo que se agregue aqui se rellena automaticamente
 * en los registros antiguos (migracion suave, ver applyDefaults()).
 */
import config from '../config.js'

export const userSchema = () => ({
  name: '',
  registered: false,
  // Economia
  money: 100,
  bank: 0,
  // XP / niveles
  xp: 0,
  level: 1,
  // Limites diarios
  limit: config.defaultLimit,
  lastLimitReset: 0,
  // Premium
  premium: false,
  premiumUntil: 0,
  // Moderacion
  banned: false,
  banReason: '',
  warn: 0,
  // RPG
  rpg: {
    health: 100,
    stamina: 100,
    exp: 0,
    lastDaily: 0,
    lastWork: 0,
    lastMine: 0,
    lastHunt: 0,
    lastAdventure: 0,
    lastRob: 0
  },
  inventory: {
    potion: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
    emerald: 0,
    sword: 0,
    pickaxe: 0,
    armor: 0,
    fish: 0,
    meat: 0
  },
  // Estadisticas
  commands: 0,
  messages: 0,
  firstSeen: 0,
  lastSeen: 0
})

export const groupSchema = () => ({
  name: '',
  welcome: false,
  welcomeText: '',
  byeText: '',
  antilink: false,
  mute: false,
  nsfw: false,
  disabledCommands: [],
  joinedAt: 0,
  lastActivity: 0
})

export const settingsSchema = () => ({
  // null = "usar el valor del .env". Solo se fijan aqui cuando el owner los
  // cambia en caliente (.setprefix / .public / .private); asi editar el .env
  // sigue funcionando despues de la primera ejecucion.
  prefix: null,
  mode: null,
  prefixExplicit: false,
  modeExplicit: false,
  bannedUsers: [],
  disabledCommands: [],
  premiumUsers: [],
  startedAt: Date.now(),
  totalCommands: 0
})

export const dbSchema = () => ({
  users: {},
  groups: {},
  settings: settingsSchema(),
  stats: { commands: {}, messages: 0 }
})

/** Rellena recursivamente las claves faltantes de `target` con las de `defaults`. */
export function applyDefaults (target, defaults) {
  const out = target && typeof target === 'object' && !Array.isArray(target) ? target : {}
  for (const [key, value] of Object.entries(defaults)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = applyDefaults(out[key], value)
    } else if (out[key] === undefined) {
      out[key] = Array.isArray(value) ? [...value] : value
    }
  }
  return out
}
