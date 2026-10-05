/**
 * Utilidades generales reutilizables por los comandos.
 */
import crypto from 'node:crypto'

/** Formatea milisegundos como "2d 4h 13m 7s". */
export function formatUptime (ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

/** Formatea bytes a unidades legibles. */
export function formatBytes (bytes, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(decimals)} ${units[i]}`
}

/** Separador de miles: 1234567 -> 1.234.567 */
export function formatNumber (n) {
  return new Intl.NumberFormat('es-ES').format(Math.round(Number(n) || 0))
}

/** Tiempo restante legible para cooldowns. */
export function timeLeft (ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h) return `${h}h ${m}m ${s}s`
  if (m) return `${m}m ${s}s`
  return `${s}s`
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const pickRandom = (array) => array[Math.floor(Math.random() * array.length)]

/** Baraja una copia del array (Fisher-Yates). */
export function shuffle (array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const capitalize = (text) => String(text || '').charAt(0).toUpperCase() + String(text || '').slice(1)

/** Recorta texto largo añadiendo puntos suspensivos. */
export function truncate (text, max = 300) {
  const value = String(text ?? '')
  return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value
}

/** Quita etiquetas HTML y normaliza espacios. */
export function stripHtml (html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function isUrl (text) {
  try {
    const url = new URL(String(text).trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isYoutubeUrl (text) {
  return /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)[\w-]{6,}/i.test(String(text).trim())
}

/** Barra de progreso en texto: ████░░░░ */
export function progressBar (current, total, size = 12) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0
  const filled = Math.round(ratio * size)
  return `${'█'.repeat(filled)}${'░'.repeat(size - filled)} ${Math.round(ratio * 100)}%`
}

export function md5 (data) {
  return crypto.createHash('md5').update(data).digest('hex')
}

export function sha256 (data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/** Fecha legible en español. */
export function formatDate (date = new Date(), withTime = true) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  const opts = { day: '2-digit', month: 'long', year: 'numeric' }
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' })
  return new Intl.DateTimeFormat('es-ES', { ...opts, timeZone: 'UTC' }).format(d)
}

/** Ejecuta una promesa con limite de tiempo. */
export function withTimeout (promise, ms, message = 'Tiempo de espera agotado') {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms) })
  ]).finally(() => clearTimeout(timer))
}

/** Divide un texto en bloques de tamaño maximo (para mensajes largos). */
export function chunkText (text, size = 3500) {
  const chunks = []
  let rest = String(text ?? '')
  while (rest.length > size) {
    let cut = rest.lastIndexOf('\n', size)
    if (cut < size * 0.5) cut = size
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }
  if (rest.trim()) chunks.push(rest)
  return chunks
}
