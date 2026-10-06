#!/usr/bin/env node
/**
 * Asistente de configuración inicial.
 *   npm run setup
 *
 * - Comprueba la versión de Node y las herramientas del sistema.
 * - Crea las carpetas necesarias (sessions/, data/, assets/temp/).
 * - Genera el archivo .env a partir de .env.example (preguntando lo básico).
 * - Verifica que todos los comandos cargan correctamente.
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

import { ensureDependencies } from '../bot/lib/preflight.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = path.join(ROOT, '.env')
const ENV_EXAMPLE = path.join(ROOT, '.env.example')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m'
}
const ok = (text) => console.log(`${c.green}✅${c.reset} ${text}`)
const warn = (text) => console.log(`${c.yellow}⚠️ ${c.reset} ${text}`)
const fail = (text) => console.log(`${c.red}❌${c.reset} ${text}`)
const info = (text) => console.log(`${c.cyan}ℹ️ ${c.reset} ${text}`)

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

async function main () {
  console.log(`\n${c.bold}╭───────────────────────────────────────────╮${c.reset}`)
  console.log(`${c.bold}│   ⚙️  CONFIGURACIÓN INICIAL DEL BOT        │${c.reset}`)
  console.log(`${c.bold}╰───────────────────────────────────────────╯${c.reset}\n`)

  /* 1. Node y dependencias */
  const major = Number(process.versions.node.split('.')[0])
  if (major < 20) {
    fail(`Node.js ${process.versions.node} detectado. Se requiere la versión 20 o superior.`)
    console.log('   Termux: pkg install nodejs-lts -y')
    process.exit(1)
  }
  ok(`Node.js ${process.versions.node}`)

  ensureDependencies('npm run setup')
  ok('Dependencias instaladas')

  if (process.env.PREFIX && (process.env.PREFIX.includes('/') || process.env.PREFIX.length > 3)) {
    info('Tu sistema define PREFIX (Termux lo usa para sus rutas): el bot la ignora y usa la del .env.')
  }

  /* 2. Carpetas */
  for (const dir of ['sessions', 'data', 'assets/temp']) {
    await fsp.mkdir(path.join(ROOT, dir), { recursive: true })
  }
  ok('Carpetas creadas: sessions/ · data/ · assets/temp/')

  /* 3. Herramientas del sistema */
  const { hasBinary, INSTALL_HINTS } = await import('../bot/lib/binaries.js')
  if (hasBinary('ffmpeg')) ok('ffmpeg instalado')
  else { warn('ffmpeg NO está instalado (stickers, audio y vídeo no funcionarán)'); console.log(`   ${INSTALL_HINTS.ffmpeg.replace(/\n/g, '\n   ')}`) }

  if (hasBinary('yt-dlp')) ok('yt-dlp instalado')
  else { warn('yt-dlp NO está instalado (opcional: .ytmp3 .ytmp4 .play .yts)'); console.log(`   ${INSTALL_HINTS['yt-dlp'].replace(/\n/g, '\n   ')}`) }

  /* 4. .env */
  const interactive = process.stdin.isTTY && !process.argv.includes('--yes')
  if (fs.existsSync(ENV_FILE)) {
    ok('.env ya existe (no se modifica)')
  } else {
    let content = await fsp.readFile(ENV_EXAMPLE, 'utf8')

    if (interactive) {
      console.log(`\n${c.bold}Responde para generar tu .env${c.reset} ${c.dim}(Enter = valor por defecto)${c.reset}\n`)
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      // Si la entrada se cierra (EOF/Ctrl+D) se usa el valor por defecto en vez de fallar.
      const ask = async (question, fallback = '') => {
        try {
          const answer = await rl.question(question)
          return String(answer ?? '').trim() || fallback
        } catch {
          console.log('')
          return fallback
        }
      }
      try {
        const botName = await ask(`🤖 Nombre del bot ${c.dim}[NombreBot]${c.reset}: `, 'NombreBot')
        const ownerName = await ask(`👤 Tu nombre ${c.dim}[Owner]${c.reset}: `, 'Owner')

        let ownerNumber = ''
        for (let i = 0; i < 3; i++) {
          const answer = await ask(`📱 Tu número de WhatsApp con código de país, solo dígitos ${c.dim}(ej. 5215512345678)${c.reset}: `)
          ownerNumber = onlyDigits(answer)
          if (!ownerNumber || (ownerNumber.length >= 8 && ownerNumber.length <= 16)) break
          warn('Número no válido (entre 8 y 16 dígitos).')
        }

        const prefix = await ask(`🎋 Prefijo de los comandos ${c.dim}[.]${c.reset}: `, '.')
        const mode = (await ask(`🍡 Modo ${c.dim}[public/private]${c.reset}: `, 'public')).toLowerCase() === 'private'
          ? 'private' : 'public'

        content = content
          .replace(/^BOT_NAME=.*$/m, `BOT_NAME=${botName}`)
          .replace(/^OWNER_NAME=.*$/m, `OWNER_NAME=${ownerName}`)
          .replace(/^OWNER_NUMBER=.*$/m, `OWNER_NUMBER=${ownerNumber}`)
          .replace(/^PREFIX=.*$/m, `PREFIX=${prefix}`)
          .replace(/^BOT_MODE=.*$/m, `BOT_MODE=${mode}`)
      } finally {
        rl.close()
      }
    } else {
      info('Modo no interactivo: se copia .env.example tal cual.')
    }

    await fsp.writeFile(ENV_FILE, content)
    await fsp.chmod(ENV_FILE, 0o600).catch(() => {})
    ok('.env creado')
  }

  /* 5. Banner */
  if (fs.existsSync(path.join(ROOT, 'assets', 'banner.jpg'))) ok('assets/banner.jpg encontrado')
  else warn('Falta assets/banner.jpg (el menú se enviará solo como texto)')

  /* 6. Base de datos + comandos */
  const { initDatabase, db } = await import('../bot/database/index.js')
  await initDatabase()
  await db.save(true)
  ok('Base de datos lista en data/database.json')

  const { registry } = await import('../bot/lib/loader.js')
  await registry.load()
  if (registry.errors.length) {
    fail(`${registry.errors.length} comando(s) con errores:`)
    for (const item of registry.errors) console.log(`   · ${item.file}: ${item.error}`)
  }
  ok(`${registry.size} comandos cargados en ${registry.byCategory().size} categorías`)

  /* 7. Resumen (se lee el .env recién escrito, no la configuración en memoria) */
  const envText = await fsp.readFile(ENV_FILE, 'utf8')
  const envValue = (key) => (envText.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1] || '').trim()
  const ownerNumber = onlyDigits(envValue('OWNER_NUMBER'))
  const apiKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'WEATHER_API_KEY', 'REMOVE_BG_API_KEY']

  console.log(`\n${c.bold}╭───────────── RESUMEN ─────────────╮${c.reset}`)
  console.log(`  Bot        ☇ ${envValue('BOT_NAME')} v${envValue('BOT_VERSION')}`)
  console.log(`  Prefijo    ☇ ${envValue('PREFIX')}`)
  console.log(`  Modo       ☇ ${envValue('BOT_MODE')}`)
  console.log(`  Owner      ☇ ${envValue('OWNER_NAME')} (${ownerNumber || 'SIN CONFIGURAR'})`)
  console.log(`  Comandos   ☇ ${registry.size}`)
  console.log(`  APIs       ☇ ${apiKeys.map((k) => `${k.replace('_API_KEY', '')} ${envValue(k) ? '✅' : '—'}`).join('  ')}`)
  console.log(`${c.bold}╰───────────────────────────────────╯${c.reset}\n`)

  if (!ownerNumber) {
    warn('OWNER_NUMBER está vacío: edita el .env antes de usar los comandos de propietario.\n')
  }

  console.log(`${c.green}${c.bold}Todo listo.${c.reset} Inicia el bot con: ${c.bold}npm start${c.reset}\n`)
  process.exit(0)
}

main().catch((error) => {
  fail(`La configuración falló: ${error.message}`)
  process.exit(1)
})
