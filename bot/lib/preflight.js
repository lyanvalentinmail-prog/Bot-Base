/**
 * Comprobación previa de dependencias.
 *
 * Este archivo SOLO puede usar módulos nativos de Node: se ejecuta antes que
 * cualquier import del proyecto para poder avisar con un mensaje claro cuando
 * falta `npm install` (si no, Node lanzaría un "Cannot find package ..." seco).
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Devuelve la lista de dependencias declaradas que faltan en node_modules. */
export function missingDependencies () {
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  } catch {
    return []
  }
  const names = Object.keys(pkg.dependencies || {})
  return names.filter((name) => !fs.existsSync(path.join(ROOT, 'node_modules', name, 'package.json')))
}

/**
 * Si falta alguna dependencia, explica cómo instalarla y termina el proceso.
 * @param {string} [command] comando que el usuario estaba ejecutando
 */
export function ensureDependencies (command = 'npm start') {
  const missing = missingDependencies()
  if (!missing.length) return

  const hasNodeModules = fs.existsSync(path.join(ROOT, 'node_modules'))
  const list = missing.slice(0, 8).join(', ') + (missing.length > 8 ? `, +${missing.length - 8} más` : '')

  console.error('\n\x1b[31m❌ Faltan dependencias del proyecto.\x1b[0m')
  console.error(hasNodeModules
    ? `   La instalación quedó incompleta. No se encuentran: ${list}`
    : '   Todavía no se ha instalado nada (no existe la carpeta node_modules).')
  console.error('\n\x1b[1m   Solución:\x1b[0m')
  console.error(`      cd ${ROOT}`)
  if (hasNodeModules) {
    console.error('      rm -rf node_modules package-lock.json')
    console.error('      npm cache clean --force')
  }
  console.error('      npm install')
  console.error(`      ${command}`)
  console.error('\n\x1b[2m   Si `npm install` falla en Termux:\x1b[0m')
  console.error('\x1b[2m      pkg install nodejs-lts git -y   (git es obligatorio: Baileys lo usa)\x1b[0m')
  console.error('\x1b[2m      pkg update -y && pkg upgrade -y\x1b[0m')
  console.error('\x1b[2m      npm install --no-audit --no-fund\x1b[0m\n')
  process.exit(1)
}

export default ensureDependencies
