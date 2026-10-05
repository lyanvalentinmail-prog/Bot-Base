/**
 * Logger central (pino). En desarrollo usa pino-pretty, en produccion JSON.
 * Redacta automaticamente claves y credenciales para que nunca acaben en los logs.
 */
import pino from 'pino'
import config from '../config.js'

const REDACT_PATHS = [
  'key', 'keys', 'apiKey', 'api_key', 'token', 'authorization', 'Authorization',
  'password', 'secret', 'creds', 'credentials',
  '*.key', '*.apiKey', '*.api_key', '*.token', '*.authorization', '*.password',
  'headers.authorization', 'headers.Authorization', 'config.headers.Authorization',
  'req.headers.authorization', 'response.config.headers.Authorization'
]

const pretty = config.nodeEnv !== 'production'

export const logger = pino({
  level: config.logLevel || 'info',
  base: undefined,
  redact: { paths: REDACT_PATHS, censor: '[oculto]' },
  ...(pretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' }
        }
      }
    : {})
})

/** Logger silencioso para Baileys (su salida es muy verbosa). */
export const waLogger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'silent' })

/** Quita posibles secretos de un texto antes de imprimirlo. */
export function sanitize (text) {
  let out = String(text ?? '')
  for (const value of Object.values(config.keys)) {
    if (value && value.length > 6) out = out.split(value).join('[oculto]')
  }
  return out
    .replace(/(sk-[A-Za-z0-9_-]{8,})/g, '[oculto]')
    .replace(/(AIza[0-9A-Za-z_-]{10,})/g, '[oculto]')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[oculto]')
}

export default logger
