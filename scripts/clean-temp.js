#!/usr/bin/env node
/**
 * Borra los archivos temporales de assets/temp.
 *   npm run clean
 */
import fsp from 'node:fs/promises'
import path from 'node:path'

import { ensureDependencies } from '../bot/lib/preflight.js'

async function main () {
  ensureDependencies('npm run clean')

  const { default: config } = await import('../bot/config.js')
  const dir = config.paths.temp

  const entries = await fsp.readdir(dir).catch(() => [])
  let removed = 0
  for (const entry of entries) {
    if (entry === '.gitkeep') continue
    await fsp.rm(path.join(dir, entry), { recursive: true, force: true }).catch(() => {})
    removed++
  }
  console.log(`🧹 ${removed} archivo(s) temporal(es) eliminado(s) de assets/temp.`)
}

main().catch((error) => {
  console.error(`❌ Error limpiando temporales: ${error.message}`)
  process.exit(1)
})
