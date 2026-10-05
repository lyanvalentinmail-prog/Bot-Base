/**
 * Configuracion global del bot.
 * Todo sale de variables de entorno (.env). Nada de claves hardcodeadas.
 */
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = path.resolve(__dirname, '..')

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(String(value).trim().toLowerCase())
}

const int = (value, fallback) => {
  const n = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(n) ? n : fallback
}

const str = (value, fallback = '') => {
  const v = String(value ?? '').trim()
  return v === '' ? fallback : v
}

/** Normaliza un numero telefonico: solo digitos. */
export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

const owners = str(process.env.OWNER_NUMBER)
  .split(/[,;\s]+/)
  .map(onlyDigits)
  .filter((n) => n.length >= 7)

export const config = {
  // Identidad
  botName: str(process.env.BOT_NAME, 'Bot-Base'),
  botVersion: str(process.env.BOT_VERSION, '1.0.0'),
  prefix: str(process.env.PREFIX, '.'),
  ownerName: str(process.env.OWNER_NAME, 'Owner'),
  ownerNumbers: owners,
  mode: str(process.env.BOT_MODE, 'public').toLowerCase() === 'private' ? 'private' : 'public',

  // Limites
  defaultLimit: int(process.env.DEFAULT_LIMIT, 10),
  premiumLimit: int(process.env.PREMIUM_LIMIT, 50),
  cooldown: int(process.env.COMMAND_COOLDOWN, 3),

  // Comportamiento
  enableGroups: bool(process.env.ENABLE_GROUPS, true),
  autoRead: bool(process.env.AUTO_READ, false),
  nodeEnv: str(process.env.NODE_ENV, 'production'),
  logLevel: str(process.env.LOG_LEVEL, 'info'),

  // Sesion
  sessionName: str(process.env.SESSION_NAME, 'default'),
  pairingNumber: onlyDigits(process.env.PAIRING_NUMBER),

  // Rutas
  paths: {
    root: ROOT,
    bot: __dirname,
    commands: path.join(__dirname, 'commands'),
    sessions: path.join(ROOT, 'sessions', str(process.env.SESSION_NAME, 'default')),
    data: path.join(ROOT, 'data'),
    assets: path.join(ROOT, 'assets'),
    temp: path.join(ROOT, 'assets', 'temp'),
    banner: path.join(ROOT, 'assets', 'banner.jpg')
  },

  // API keys (vacio = servicio no configurado)
  keys: {
    openai: str(process.env.OPENAI_API_KEY),
    gemini: str(process.env.GEMINI_API_KEY),
    weather: str(process.env.WEATHER_API_KEY),
    removebg: str(process.env.REMOVE_BG_API_KEY)
  },

  // Modelos de IA
  models: {
    openaiChat: str(process.env.OPENAI_MODEL, 'gpt-4o-mini'),
    openaiImage: str(process.env.OPENAI_IMAGE_MODEL, 'gpt-image-1'),
    openaiTts: str(process.env.OPENAI_TTS_MODEL, 'gpt-4o-mini-tts'),
    gemini: str(process.env.GEMINI_MODEL, 'gemini-2.0-flash')
  }
}

/** Mensaje estandar cuando falta una API key. */
export const NOT_CONFIGURED = '⚠️ Este servicio no está configurado.'

export default config
