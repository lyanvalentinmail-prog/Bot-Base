/**
 * Errores tipados. Permiten que el handler responda mensajes amables
 * sin mostrar nunca un stack trace al usuario.
 */
import { NOT_CONFIGURED } from '../config.js'

/** Error "esperado": su mensaje SI se muestra al usuario. */
export class UserError extends Error {
  constructor (message) {
    super(message)
    this.name = 'UserError'
    this.expected = true
  }
}

/** Falta una API key en el .env */
export class MissingKeyError extends UserError {
  constructor (service = '') {
    super(`${NOT_CONFIGURED}${service ? `\n\n🔑 Falta la variable *${service}* en tu archivo .env` : ''}`)
    this.name = 'MissingKeyError'
    this.service = service
  }
}

/** Fallo al hablar con un servicio externo. */
export class ApiError extends UserError {
  constructor (service, detail = '') {
    super(`🌐 El servicio *${service}* no respondió correctamente.${detail ? `\n_${detail}_` : ''}`)
    this.name = 'ApiError'
    this.service = service
  }
}

/** Falta una herramienta del sistema (ffmpeg, yt-dlp...). */
export class MissingBinaryError extends UserError {
  constructor (binary, hint = '') {
    super(`🧩 *${binary}* no está instalado en este sistema.${hint ? `\n\n${hint}` : ''}`)
    this.name = 'MissingBinaryError'
    this.binary = binary
  }
}

export const isExpectedError = (error) => Boolean(error?.expected)
