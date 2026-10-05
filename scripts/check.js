#!/usr/bin/env node
/**
 * Diagnóstico del proyecto (no conecta con WhatsApp).
 *   npm run check
 *
 * Verifica: imports, metadata de los comandos, categorías, base de datos,
 * configuración, menú y archivos sensibles ignorados por git.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const c = { reset: '\x1b[0m', bold: '\x1b[1m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', dim: '\x1b[2m' }

let errors = 0
let warnings = 0
const ok = (t) => console.log(`${c.green}✅${c.reset} ${t}`)
const warn = (t) => { warnings++; console.log(`${c.yellow}⚠️ ${c.reset} ${t}`) }
const fail = (t) => { errors++; console.log(`${c.red}❌${c.reset} ${t}`) }

async function main () {
  console.log(`\n${c.bold}🔍 DIAGNÓSTICO DEL BOT${c.reset}\n`)

  /* Config */
  const { default: config } = await import('../bot/config.js')
  ok(`Configuración cargada · ${config.botName} v${config.botVersion} · prefijo "${config.prefix}"`)
  if (!config.ownerNumbers.length) warn('OWNER_NUMBER vacío: los comandos de propietario no funcionarán')

  /* Base de datos */
  const { initDatabase, db, getUser } = await import('../bot/database/index.js')
  await initDatabase()
  const testUser = getUser('000000000000@s.whatsapp.net', 'Test')
  if (testUser && typeof testUser.money === 'number' && typeof testUser.rpg === 'object') {
    ok('Base de datos operativa (usuarios, economía, RPG, límites)')
  } else {
    fail('El esquema de usuario no se generó correctamente')
  }
  delete db.users['000000000000']

  /* Comandos */
  const { registry } = await import('../bot/lib/loader.js')
  await registry.load()
  for (const item of registry.errors) fail(`${item.file}: ${item.error}`)
  if (!registry.errors.length) ok(`${registry.size} comandos cargados sin errores`)

  /* Metadata */
  const { CATEGORY_IDS } = await import('../bot/lib/categories.js')
  const seen = new Set()
  for (const command of registry.list()) {
    const where = path.relative(ROOT, command.file)
    if (!CATEGORY_IDS.includes(command.category)) warn(`${where}: categoría "${command.category}" no está en categories.js`)
    if (!command.description || command.description === 'Sin descripción') warn(`${where}: sin descripción`)
    if (command.args && !/^[<[]/.test(command.args.trim())) warn(`${where}: args debería usar <obligatorio> o [opcional]`)
    for (const alias of command.aliases) {
      if (seen.has(alias)) warn(`${where}: alias duplicado "${alias}"`)
      seen.add(alias)
    }
    seen.add(command.name)
  }

  /* Resumen por categoría */
  console.log(`\n${c.bold}📂 Comandos por categoría${c.reset}`)
  const grouped = registry.byCategory()
  for (const [category, commands] of grouped) {
    console.log(`   ${String(category).padEnd(12)} ${String(commands.length).padStart(3)}  ${c.dim}${commands.map((x) => x.name).join(', ')}${c.reset}`)
  }
  console.log(`   ${'TOTAL'.padEnd(12)} ${String(registry.total).padStart(3)}\n`)

  /* Permisos */
  const counts = {
    premium: registry.list().filter((x) => x.premium).length,
    limit: registry.list().filter((x) => x.limit).length,
    owner: registry.list().filter((x) => x.owner).length,
    admin: registry.list().filter((x) => x.admin).length
  }
  ok(`Permisos ☇ Ⓟ ${counts.premium}  Ⓛ ${counts.limit}  Ⓞ ${counts.owner}  Ⓐ ${counts.admin}`)

  /* Menú */
  const menu = await import('../bot/lib/menu.js')
  const main = menu.buildMainMenu({
    userName: 'Usuario', registry, prefix: config.prefix, mode: config.mode, uptimeMs: 1234567, status: 'Activo'
  })
  if (main.includes(config.botName) && main.includes(String(registry.total))) ok('Menú principal generado correctamente')
  else fail('El menú principal no contiene los datos dinámicos esperados')

  const sample = menu.buildCategoryMenu(registry, 'ai', config.prefix)
  if (sample?.includes('୨୧')) ok('Menú por categoría generado correctamente')
  else fail('El menú por categoría falló')

  const sections = menu.buildCategorySections(registry, config.prefix)
  ok(`Lista de categorías: ${sections.reduce((total, s) => total + s.rows.length, 0)} entradas en ${sections.length} sección(es)`)

  /* Herramientas */
  const { hasBinary } = await import('../bot/lib/binaries.js')
  hasBinary('ffmpeg') ? ok('ffmpeg disponible') : warn('ffmpeg no disponible (stickers/audio/vídeo desactivados)')
  hasBinary('yt-dlp') ? ok('yt-dlp disponible') : warn('yt-dlp no disponible (descargas de YouTube desactivadas)')

  /* Seguridad */
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')
  for (const entry of ['.env', 'sessions/', 'data/', 'node_modules/', 'assets/temp/']) {
    if (gitignore.includes(entry)) ok(`.gitignore protege ${entry}`)
    else fail(`.gitignore NO protege ${entry}`)
  }
  if (fs.existsSync(path.join(ROOT, '.env'))) {
    const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8')
    const leaked = /(OPENAI|GEMINI|WEATHER|REMOVE_BG)_API_KEY=\S+/.test(env)
    if (leaked) ok('.env contiene claves (asegúrate de que nunca se suba al repositorio)')
  }

  /* Resultado */
  console.log(`\n${c.bold}──────────────────────────────${c.reset}`)
  if (errors) {
    console.log(`${c.red}${c.bold}${errors} error(es)${c.reset} y ${warnings} aviso(s).\n`)
    process.exit(1)
  }
  console.log(`${c.green}${c.bold}Sin errores${c.reset} · ${warnings} aviso(s).\n`)
  process.exit(0)
}

main().catch((error) => {
  console.error(`\n${c.red}❌ El diagnóstico falló:${c.reset} ${error.message}\n${error.stack}`)
  process.exit(1)
})
