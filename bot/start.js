#!/usr/bin/env node
/**
 * Punto de entrada del bot.
 * Arranque: comprobaciones -> base de datos -> comandos -> conexion WhatsApp.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import config, { prefixWasShadowed, shadowedEnvKeys } from './config.js'
import logger from './lib/logger.js'
import registry from './lib/loader.js'
import { initDatabase, db, getPrefix, getMode } from './database/index.js'
import { startTempSweeper, ensureTempDir } from './lib/tmp.js'
import { hasBinary } from './lib/binaries.js'
import { createHandler, prefixList } from './handler.js'
import { connect, state } from './connection.js'
import { servicesStatus } from './lib/apiClient.js'

const MIN_NODE_MAJOR = 20

function banner () {
  console.log(`
  ╭───────────────────────────────────────────────╮
     🤖  ${config.botName}  v${config.botVersion}
     Bot de WhatsApp modular · Baileys · Node ${process.versions.node}
  ╰───────────────────────────────────────────────╯`)
}

function preflight () {
  const major = Number(process.versions.node.split('.')[0])
  if (major < MIN_NODE_MAJOR) {
    console.error(`\n❌ Se requiere Node.js ${MIN_NODE_MAJOR} o superior (tienes ${process.versions.node}).`)
    console.error('   Termux: pkg install nodejs-lts -y\n')
    process.exit(1)
  }

  if (prefixWasShadowed) {
    console.warn('ℹ️  Tu sistema define PREFIX (Termux lo usa para sus rutas): se ignora y se usa el del .env.')
    console.warn('   Si quieres fijarlo desde la terminal, usa BOT_PREFIX en vez de PREFIX.\n')
  }

  const otherShadowed = shadowedEnvKeys.filter((key) => key !== 'PREFIX')
  if (otherShadowed.length) {
    console.warn(`⚠️  Estas variables del sistema tienen prioridad sobre tu .env: ${otherShadowed.join(', ')}\n`)
  }

  if (!fs.existsSync(path.join(config.paths.root, '.env'))) {
    console.warn('\n⚠️  No existe el archivo .env. Ejecuta: npm run setup')
    console.warn('   Se usarán los valores por defecto.\n')
  }

  if (!config.ownerNumbers.length) {
    console.warn('⚠️  OWNER_NUMBER está vacío: los comandos de propietario quedarán inaccesibles.')
    console.warn('   Edita el .env y escribe tu número (solo dígitos, con código de país).\n')
  }

  if (!hasBinary('ffmpeg')) {
    console.warn('⚠️  ffmpeg no está instalado: stickers, audio y vídeo no funcionarán.')
    console.warn('   Termux: pkg install ffmpeg -y   ·   Linux: sudo apt install ffmpeg -y\n')
  }

  if (!fs.existsSync(config.paths.banner)) {
    console.warn('⚠️  Falta assets/banner.jpg: el menú se enviará solo como texto.\n')
  }

  ensureTempDir()
}

function reportServices () {
  const services = servicesStatus()
  const ready = services.filter((s) => s.ready).map((s) => s.name)
  const missing = services.filter((s) => !s.ready).map((s) => s.env)
  if (ready.length) logger.info({ activos: ready }, 'servicios externos configurados')
  if (missing.length) logger.info({ sinConfigurar: missing }, 'servicios sin clave (sus comandos avisarán al usuario)')
}

async function main () {
  banner()
  preflight()

  await initDatabase()
  await registry.load()

  if (registry.errors.length) {
    console.warn(`\n⚠️  ${registry.errors.length} comando(s) no se pudieron cargar:`)
    for (const item of registry.errors) console.warn(`   · ${item.file}: ${item.error}`)
    console.warn('')
  }

  console.log(`📦 Comandos cargados: ${registry.size} (${registry.byCategory().size} categorías)`)
  console.log(
    `💬 Prefijo activo: "${getPrefix()}"  ·  Modo: ${getMode()}  ·  ` +
    `Owner: ${config.ownerNumbers.join(', ') || 'SIN CONFIGURAR'}`
  )
  if (config.multiPrefix) {
    console.log(`   También acepta: ${prefixList(getPrefix()).filter((p) => p !== getPrefix()).join(' ')}  (MULTI_PREFIX=false para desactivarlo)`)
  }
  if (getMode() === 'private') {
    console.log('   ⚠️  En modo privado SOLO responde al owner. Usa .public o BOT_MODE=public para abrirlo.')
  }
  console.log(`   Prueba enviando: ${getPrefix()}menu`)
  reportServices()
  startTempSweeper()

  const handler = createHandler(state)
  await connect(handler)
}

/* ─── Manejo global de errores: el bot nunca debe morir por un fallo aislado ─── */

process.on('uncaughtException', (error) => {
  logger.error({ err: error.message, stack: error.stack }, 'excepción no capturada')
})

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason)
  const stack = reason instanceof Error ? reason.stack : undefined
  logger.error({ err: message, stack }, 'promesa rechazada sin manejar')
})

let shuttingDown = false
async function shutdown (signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n⏹️  Cerrando (${signal})...`)
  try {
    db.close()
    state.sock?.end?.(undefined)
  } catch (error) {
    logger.error({ err: error.message }, 'error al cerrar')
  }
  console.log('💾 Base de datos guardada. ¡Hasta luego!')
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

main().catch((error) => {
  logger.error({ err: error.message, stack: error.stack }, 'fallo crítico al arrancar')
  console.error(`\n❌ No se pudo iniciar el bot: ${error.message}\n`)
  process.exit(1)
})
