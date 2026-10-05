#!/usr/bin/env node
/**
 * Borra la sesión de WhatsApp para volver a vincular el bot.
 *   npm run reset-session            (pide confirmación)
 *   npm run reset-session -- --yes   (sin preguntar)
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function main () {
  const { default: config } = await import('../bot/config.js')
  const sessionDir = config.paths.sessions

  console.log(`\n🔐 Carpeta de sesión: ${path.relative(ROOT, sessionDir) || sessionDir}`)

  if (!fs.existsSync(sessionDir)) {
    console.log('ℹ️  No hay ninguna sesión guardada. Nada que borrar.\n')
    return
  }

  const files = await fsp.readdir(sessionDir).catch(() => [])
  console.log(`📄 Archivos encontrados: ${files.length}`)

  const auto = process.argv.includes('--yes') || process.argv.includes('-y') || !process.stdin.isTTY
  if (!auto) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question('\n⚠️  Esto cerrará la sesión y tendrás que vincular el bot otra vez.\n   ¿Continuar? (s/N): ')
    rl.close()
    if (!/^(s|si|sí|y|yes)$/i.test(answer.trim())) {
      console.log('❎ Cancelado.\n')
      return
    }
  }

  await fsp.rm(sessionDir, { recursive: true, force: true })
  await fsp.mkdir(sessionDir, { recursive: true })
  console.log('\n✅ Sesión borrada. Ejecuta `npm start` y vincula de nuevo con el Pairing Code.\n')
}

main().catch((error) => {
  console.error(`❌ No se pudo borrar la sesión: ${error.message}`)
  process.exit(1)
})
