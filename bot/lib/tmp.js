/**
 * Gestion de archivos temporales en assets/temp.
 * Todo archivo creado aqui se borra al terminar el comando y, por si acaso,
 * un barrido periodico elimina lo que supere los 10 minutos de antiguedad.
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import config from '../config.js'
import logger from './logger.js'

const TEMP_DIR = config.paths.temp
const MAX_AGE_MS = 10 * 60 * 1000

export function ensureTempDir () {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
  return TEMP_DIR
}

/** Devuelve una ruta temporal unica (no crea el archivo). */
export function tempPath (extension = 'tmp') {
  ensureTempDir()
  const ext = String(extension).replace(/^\./, '')
  return path.join(TEMP_DIR, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`)
}

/** Escribe un buffer en un archivo temporal y devuelve su ruta. */
export async function writeTemp (buffer, extension = 'bin') {
  const file = tempPath(extension)
  await fsp.writeFile(file, buffer)
  return file
}

/** Borra archivos sin lanzar errores. */
export async function cleanup (...files) {
  await Promise.all(
    files.flat().filter(Boolean).map((file) => fsp.rm(file, { force: true }).catch(() => {}))
  )
}

/**
 * Ejecuta una tarea garantizando el borrado de los temporales que registre.
 * @param {(track: (file: string) => string) => Promise<any>} task
 */
export async function withTempFiles (task) {
  const files = []
  const track = (file) => { files.push(file); return file }
  try {
    return await task(track)
  } finally {
    await cleanup(files)
  }
}

/** Borra los temporales mas viejos que MAX_AGE_MS. */
export async function sweepTemp () {
  try {
    ensureTempDir()
    const entries = await fsp.readdir(TEMP_DIR)
    const now = Date.now()
    let removed = 0
    for (const entry of entries) {
      if (entry === '.gitkeep') continue
      const file = path.join(TEMP_DIR, entry)
      const stat = await fsp.stat(file).catch(() => null)
      if (stat && now - stat.mtimeMs > MAX_AGE_MS) {
        await fsp.rm(file, { force: true, recursive: true }).catch(() => {})
        removed++
      }
    }
    if (removed) logger.debug({ removed }, 'temporales eliminados')
    return removed
  } catch (error) {
    logger.warn({ err: error.message }, 'no se pudo limpiar assets/temp')
    return 0
  }
}

/** Arranca el barrido periodico de temporales. */
export function startTempSweeper (intervalMs = 5 * 60 * 1000) {
  sweepTemp()
  const timer = setInterval(sweepTemp, intervalMs)
  timer.unref?.()
  return timer
}

export default { tempPath, writeTemp, cleanup, withTempFiles, sweepTemp, startTempSweeper, ensureTempDir }
