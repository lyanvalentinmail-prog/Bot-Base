/**
 * Integracion con yt-dlp (https://github.com/yt-dlp/yt-dlp).
 *
 * Solo se usa para contenido PUBLICO. No se implementa ningun tipo de bypass
 * de DRM, muros de pago, CAPTCHA, autenticacion ni contenido privado.
 */
import fsp from 'node:fs/promises'
import path from 'node:path'
import { requireBinary, run, hasBinary } from './binaries.js'
import { tempPath, cleanup } from './tmp.js'
import { UserError } from './errors.js'
import { ffmpegAvailable } from './ffmpeg.js'

export const available = () => hasBinary('yt-dlp')

const COMMON_ARGS = ['--no-warnings', '--no-playlist', '--no-progress', '--ignore-config']

/** Busca vídeos públicos en YouTube. */
export async function search (query, limit = 5) {
  requireBinary('yt-dlp')
  const { stdout } = await run('yt-dlp', [
    ...COMMON_ARGS, '--flat-playlist', '--dump-single-json', `ytsearch${limit}:${query}`
  ], { timeout: 90_000 })

  const data = JSON.parse(stdout.toString() || '{}')
  return (data.entries || []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
    duration: entry.duration || 0,
    channel: entry.channel || entry.uploader || '',
    views: entry.view_count || 0,
    thumbnail: entry.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`
  }))
}

/** Metadatos de un vídeo público. */
export async function info (url) {
  requireBinary('yt-dlp')
  const { stdout } = await run('yt-dlp', [...COMMON_ARGS, '--dump-single-json', url], { timeout: 90_000 })
  const data = JSON.parse(stdout.toString() || '{}')
  return {
    id: data.id,
    title: data.title,
    url: data.webpage_url || url,
    duration: data.duration || 0,
    channel: data.channel || data.uploader || '',
    views: data.view_count || 0,
    uploadDate: data.upload_date || '',
    thumbnail: data.thumbnail || '',
    isLive: Boolean(data.is_live)
  }
}

/** Lanza un error claro si el contenido no es descargable por política. */
function assertDownloadable (meta, maxDurationSec) {
  if (meta.isLive) throw new UserError('📡 No se pueden descargar transmisiones en directo.')
  if (meta.duration && meta.duration > maxDurationSec) {
    throw new UserError(
      `⏱️ El contenido dura ${Math.round(meta.duration / 60)} minutos y el límite es ` +
      `${Math.round(maxDurationSec / 60)}. Prueba con algo más corto.`
    )
  }
}

/**
 * Descarga el audio como MP3.
 * @returns {Promise<{ buffer: Buffer, meta: object }>}
 */
export async function downloadAudio (url, { maxDuration = 1800, maxFileSize = '45M' } = {}) {
  requireBinary('yt-dlp')
  if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para extraer el audio.\nTermux: `pkg install ffmpeg -y`')

  const meta = await info(url)
  assertDownloadable(meta, maxDuration)

  const base = tempPath('')
  const output = `${base}.%(ext)s`
  const expected = `${base}.mp3`
  try {
    await run('yt-dlp', [
      ...COMMON_ARGS,
      '-f', 'bestaudio/best',
      '-x', '--audio-format', 'mp3', '--audio-quality', '5',
      '--max-filesize', maxFileSize,
      '-o', output, url
    ], { timeout: 600_000 })

    const buffer = await fsp.readFile(expected).catch(() => null)
    if (!buffer) throw new UserError('❌ La descarga superó el límite de tamaño o no se generó el archivo.')
    return { buffer, meta }
  } finally {
    await cleanup(expected, base, `${base}.webm`, `${base}.m4a`)
    await removeLeftovers(base)
  }
}

/**
 * Descarga el vídeo en MP4.
 * @param {'360'|'480'|'720'|'1080'} quality altura máxima
 */
export async function downloadVideo (url, { quality = '480', maxDuration = 900, maxFileSize = '45M' } = {}) {
  requireBinary('yt-dlp')
  const height = ['144', '240', '360', '480', '720', '1080'].includes(String(quality)) ? String(quality) : '480'

  const meta = await info(url)
  assertDownloadable(meta, maxDuration)

  const base = tempPath('')
  const output = `${base}.%(ext)s`
  const expected = `${base}.mp4`
  try {
    await run('yt-dlp', [
      ...COMMON_ARGS,
      '-f', `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/b[height<=${height}][ext=mp4]/b[height<=${height}]/b`,
      '--merge-output-format', 'mp4',
      '--max-filesize', maxFileSize,
      '-o', output, url
    ], { timeout: 900_000 })

    const buffer = await fsp.readFile(expected).catch(() => null)
    if (!buffer) throw new UserError('❌ La descarga superó el límite de tamaño o no se generó el archivo.')
    return { buffer, meta, height }
  } finally {
    await cleanup(expected, base)
    await removeLeftovers(base)
  }
}

/** Borra cualquier archivo parcial que yt-dlp haya dejado con el mismo prefijo. */
async function removeLeftovers (base) {
  try {
    const dir = path.dirname(base)
    const prefix = path.basename(base)
    const entries = await fsp.readdir(dir)
    await Promise.all(
      entries.filter((e) => e.startsWith(prefix)).map((e) => fsp.rm(path.join(dir, e), { force: true }).catch(() => {}))
    )
  } catch { /* nada que limpiar */ }
}

/** Formatea segundos como mm:ss / h:mm:ss */
export function formatDuration (seconds) {
  const total = Math.max(0, Math.round(seconds || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

export default { available, search, info, downloadAudio, downloadVideo, formatDuration }
