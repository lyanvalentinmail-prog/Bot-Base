/**
 * Deteccion y ejecucion de binarios externos (ffmpeg, ffprobe, yt-dlp).
 * El bot nunca asume que existen: si faltan, el comando avisa con instrucciones.
 */
import { spawn, spawnSync } from 'node:child_process'
import logger from './logger.js'
import { MissingBinaryError } from './errors.js'

const cache = new Map()

/** @returns {boolean} true si el binario responde en este sistema. */
export function hasBinary (binary) {
  if (cache.has(binary)) return cache.get(binary)
  let ok = false
  try {
    const probe = spawnSync(binary, ['-version'], { stdio: 'ignore', timeout: 10_000 })
    ok = probe.status === 0
    if (!ok) {
      const probe2 = spawnSync(binary, ['--version'], { stdio: 'ignore', timeout: 10_000 })
      ok = probe2.status === 0
    }
  } catch {
    ok = false
  }
  cache.set(binary, ok)
  return ok
}

export const INSTALL_HINTS = {
  ffmpeg: 'Termux: `pkg install ffmpeg -y`\nDebian/Ubuntu: `sudo apt install ffmpeg -y`',
  ffprobe: 'Se instala junto a ffmpeg.\nTermux: `pkg install ffmpeg -y`',
  'yt-dlp': 'Termux: `pkg install python -y && pip install -U yt-dlp`\nLinux: `sudo pip install -U yt-dlp` o https://github.com/yt-dlp/yt-dlp#installation'
}

export function requireBinary (binary) {
  if (!hasBinary(binary)) throw new MissingBinaryError(binary, INSTALL_HINTS[binary] || '')
  return binary
}

/**
 * Ejecuta un binario y resuelve con su salida.
 * @param {string} binary
 * @param {string[]} args
 * @param {{ timeout?: number, maxBuffer?: number, input?: Buffer }} [options]
 */
export function run (binary, args, options = {}) {
  const { timeout = 300_000, maxBuffer = 64 * 1024 * 1024 } = options
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true })
    const stdout = []
    const stderr = []
    let size = 0
    let killed = false

    const timer = setTimeout(() => {
      killed = true
      child.kill('SIGKILL')
      reject(new Error(`${binary}: tiempo de espera agotado`))
    }, timeout)

    child.stdout.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBuffer) { killed = true; child.kill('SIGKILL'); return reject(new Error(`${binary}: salida demasiado grande`)) }
      stdout.push(chunk)
    })
    child.stderr.on('data', (chunk) => stderr.push(chunk))
    child.on('error', (error) => { clearTimeout(timer); reject(error) })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (killed) return
      const err = Buffer.concat(stderr).toString()
      if (code !== 0) {
        logger.debug({ binary, code, err: err.slice(-500) }, 'binario finalizo con error')
        return reject(new Error(`${binary} finalizó con código ${code}`))
      }
      resolve({ stdout: Buffer.concat(stdout), stderr: err })
    })

    if (options.input) { child.stdin.end(options.input) } else { child.stdin.end() }
  })
}

/** Limpia la cache de deteccion (util tras instalar algo sin reiniciar). */
export function resetBinaryCache () { cache.clear() }

export default { hasBinary, requireBinary, run, INSTALL_HINTS, resetBinaryCache }
