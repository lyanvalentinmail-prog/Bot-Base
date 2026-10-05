/**
 * Conversiones multimedia con ffmpeg (invocado directamente, sin wrappers abandonados).
 * Todas las funciones trabajan con Buffers y limpian sus temporales.
 */
import fsp from 'node:fs/promises'
import { hasBinary, requireBinary, run } from './binaries.js'
import { tempPath, cleanup } from './tmp.js'

export const ffmpegAvailable = () => hasBinary('ffmpeg')

/**
 * Ejecuta ffmpeg sobre un buffer de entrada y devuelve el resultado.
 * @param {Buffer} input
 * @param {string} inputExt
 * @param {string} outputExt
 * @param {string[]} args argumentos entre -i entrada y la salida
 */
export async function convert (input, inputExt, outputExt, args = []) {
  requireBinary('ffmpeg')
  const inFile = tempPath(inputExt)
  const outFile = tempPath(outputExt)
  try {
    await fsp.writeFile(inFile, input)
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', inFile, ...args, outFile])
    return await fsp.readFile(outFile)
  } finally {
    await cleanup(inFile, outFile)
  }
}

/** Audio -> MP3 (128 kbps, 44.1 kHz). */
export const toMp3 = (buffer, ext = 'mp4') =>
  convert(buffer, ext, 'mp3', ['-vn', '-ac', '2', '-ar', '44100', '-b:a', '128k'])

/** Audio -> OPUS/OGG para notas de voz (PTT). */
export const toPtt = (buffer, ext = 'mp3') =>
  convert(buffer, ext, 'ogg', ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-ar', '48000', '-ac', '1', '-application', 'voip'])

/** Imagen -> WebP 512x512 con fondo transparente (sticker estatico). */
export const imageToWebp = (buffer, ext = 'jpg') =>
  convert(buffer, ext, 'webp', [
    '-vf',
    "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000",
    '-lossless', '0', '-compression_level', '6', '-q:v', '70', '-preset', 'picture', '-an', '-vsync', '0'
  ])

/** Video/GIF -> WebP animado (max ~8s, 15 fps), apto para sticker. */
export const videoToWebp = (buffer, ext = 'mp4') =>
  convert(buffer, ext, 'webp', [
    '-vcodec', 'libwebp',
    '-vf',
    "scale=512:512:force_original_aspect_ratio=decrease,fps=15,format=rgba,pad=512:512:-1:-1:color=#00000000,setsar=1",
    '-loop', '0', '-ss', '0', '-t', '8', '-preset', 'default', '-an', '-vsync', '0', '-q:v', '60'
  ])

/** WebP (sticker) -> PNG */
export const webpToImage = (buffer) => convert(buffer, 'webp', 'png', [])

/** WebP animado -> MP4 (pad a dimensiones pares para libx264). */
export const webpToVideo = (buffer) =>
  convert(buffer, 'webp', 'mp4', [
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
    '-c:v', 'libx264', '-movflags', '+faststart', '-pix_fmt', 'yuv420p'
  ])

/** Filtros de audio predefinidos (devuelven MP3). */
export const AUDIO_FILTERS = {
  bass: 'equalizer=f=54:width_type=o:width=2:g=20',
  nightcore: 'atempo=1.06,asetrate=44100*1.25',
  slow: 'atempo=0.7,asetrate=44100*0.9',
  fast: 'atempo=1.63,asetrate=44100*1.06',
  deep: 'atempo=4/4,asetrate=44100*0.8',
  robot: 'afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75',
  reverse: 'areverse',
  earrape: 'volume=12',
  tupai: 'atempo=0.5,asetrate=65100',
  smooth: 'atempo=0.8,asetrate=44100*0.95'
}

export async function applyAudioFilter (buffer, filterName, ext = 'mp3') {
  const filter = AUDIO_FILTERS[filterName]
  if (!filter) throw new Error(`Filtro de audio desconocido: ${filterName}`)
  return convert(buffer, ext, 'mp3', ['-filter:a', filter, '-vn', '-b:a', '128k'])
}

/** Recorta audio/video: inicio y duracion en segundos. */
export const trim = (buffer, ext, start, duration) =>
  convert(buffer, ext, ext, ['-ss', String(start), '-t', String(duration), '-c', 'copy'])

/** Cambia el volumen (multiplicador, p. ej. 1.5). */
export const changeVolume = (buffer, factor, ext = 'mp3') =>
  convert(buffer, ext, 'mp3', ['-filter:a', `volume=${factor}`, '-vn', '-b:a', '128k'])

/** Extrae metadatos basicos con ffprobe (si esta disponible). */
export async function probe (buffer, ext = 'mp4') {
  if (!hasBinary('ffprobe')) return null
  const file = tempPath(ext)
  try {
    await fsp.writeFile(file, buffer)
    const { stdout } = await run('ffprobe', [
      '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file
    ])
    return JSON.parse(stdout.toString())
  } catch {
    return null
  } finally {
    await cleanup(file)
  }
}

export default { ffmpegAvailable, convert, toMp3, toPtt, imageToWebp, videoToWebp, webpToImage, webpToVideo, applyAudioFilter, trim, changeVolume, probe, AUDIO_FILTERS }
