#!/usr/bin/env node
/**
 * Autotest del bot (NO conecta con WhatsApp).
 *   npm run selftest
 *
 * Simula un socket de Baileys y hace pasar mensajes reales por el handler
 * completo (serializador -> base de datos -> middlewares -> comando) para
 * comprobar que los comandos responden, que los permisos se aplican y que un
 * error en un comando no tumba el bot.
 *
 * Usa una base de datos temporal: no toca tus datos.
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { ensureDependencies } from '../bot/lib/preflight.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DB_FILE = path.join(ROOT, 'data', 'database.json')
const DB_BACKUP = path.join(ROOT, 'data', '.selftest-backup.json')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m'
}

let passed = 0
let failed = 0

function check (label, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`${c.green}✅${c.reset} ${label}`)
  } else {
    failed++
    console.log(`${c.red}❌${c.reset} ${label}${detail ? `\n   ${c.dim}${detail}${c.reset}` : ''}`)
  }
}

/* ─────────────── Socket simulado ─────────────── */

const BOT = '111111111111@s.whatsapp.net'
const OWNER = '222222222222@s.whatsapp.net'
const USER = '333333333333@s.whatsapp.net'
const GROUP = '120363000000000000@g.us'

const sent = []

const sock = {
  user: { id: BOT, name: 'Bot' },
  async sendMessage (jid, content) {
    sent.push({ jid, content })
    return { key: { id: `mock-${sent.length}`, remoteJid: jid, fromMe: true } }
  },
  async relayMessage (jid, content) {
    sent.push({ jid, content, relay: true })
    return `relay-${sent.length}`
  },
  async readMessages () {},
  async sendPresenceUpdate () {},
  async groupMetadata (jid) {
    return {
      id: jid,
      subject: 'Grupo de prueba',
      owner: OWNER,
      participants: [
        { id: BOT, admin: 'admin' },
        { id: OWNER, admin: 'superadmin' },
        { id: USER, admin: null }
      ]
    }
  },
  async groupParticipantsUpdate () { return [] },
  async groupSettingUpdate () {},
  async profilePictureUrl () { throw new Error('sin foto') },
  generateMessageTag: () => String(Date.now()),
  waUploadToServer: async () => ({})
}

/** Texto de todo lo enviado desde la última llamada a `reset()`. */
function output () {
  return sent.map((item) => {
    const content = item.content || {}
    const interactive = content.interactiveMessage || content.viewOnceMessage?.message?.interactiveMessage
    return [
      content.text,
      content.caption,
      interactive?.body?.text,
      interactive?.header?.title,
      JSON.stringify(interactive?.nativeFlowMessage || '')
    ].filter(Boolean).join('\n')
  }).join('\n---\n')
}

function reset () { sent.length = 0 }

function message (text, { from = USER, chat = null, fromMe = false } = {}) {
  const remoteJid = chat || (from === USER ? USER : from)
  const isGroup = remoteJid.endsWith('@g.us')
  return {
    key: {
      remoteJid,
      fromMe,
      id: `msg-${Math.random().toString(36).slice(2, 10)}`,
      ...(isGroup ? { participant: from } : {})
    },
    pushName: 'Tester',
    messageTimestamp: Math.floor(Date.now() / 1000),
    message: { conversation: text }
  }
}

/* ─────────────── Ejecución ─────────────── */

async function main () {
  ensureDependencies('npm run selftest')

  console.log(`\n${c.bold}╭──────────────────────────────────────╮${c.reset}`)
  console.log(`${c.bold}│   🧪  AUTOTEST DEL BOT (sin WhatsApp) │${c.reset}`)
  console.log(`${c.bold}╰──────────────────────────────────────╯${c.reset}\n`)

  // Base de datos temporal: se respalda la real y se restaura al terminar.
  await fsp.mkdir(path.join(ROOT, 'data'), { recursive: true })
  const hadDb = fs.existsSync(DB_FILE)
  if (hadDb) await fsp.copyFile(DB_FILE, DB_BACKUP)
  if (hadDb) await fsp.rm(DB_FILE)

  // El owner de la prueba se fija por entorno antes de cargar la configuración.
  process.env.OWNER_NUMBER = '222222222222'
  process.env.BOT_MODE = 'public'
  process.env.PREFIX = process.env.PREFIX || '.'

  const { default: config } = await import('../bot/config.js')
  const { initDatabase, db, getPrefix, setSetting, getUser } = await import('../bot/database/index.js')
  const { default: registry } = await import('../bot/lib/loader.js')
  const { createHandler } = await import('../bot/handler.js')
  const { clearAll: clearCooldowns } = await import('../bot/lib/cooldown.js')

  await initDatabase()
  await registry.load()
  const handle = createHandler({ startedAt: Date.now() })
  const prefix = getPrefix()

  const send = async (text, options) => {
    reset()
    clearCooldowns() // el autotest manda mensajes seguidos: sin esto saltaria el anti-spam
    await handle(sock, { type: 'notify', messages: [message(text, options)] })
    return output()
  }

  /* 1. Infraestructura */
  check(`configuración cargada (prefijo "${prefix}")`, prefix === config.prefix)
  check(`comandos cargados (${registry.size})`, registry.size > 0)
  check('el .env manda sobre la base de datos nueva', db.settings.prefix === null)

  /* 2. Comandos básicos */
  let out = await send(`${prefix}ping`)
  check('.ping responde', /pong|ms|🏓/i.test(out), out.slice(0, 120))

  out = await send(`${prefix}menu`)
  check('.menu responde con la tarjeta del bot', out.includes(config.botName) && /ᴛᴏᴛᴀʟ|VER LISTA|ᴄᴏᴍᴀɴᴅᴏ|📚/i.test(out), out.slice(0, 160))
  check('.menu no inventa el total de comandos', out.includes(String(registry.size)) || out.includes(String(registry.total)))

  out = await send(`${prefix}menu list`)
  check('.menu list muestra las categorías', /ᴀɪ|ᴛᴏᴏʟs|ᴛᴏᴏʟꜱ|RPG|ʀᴘɢ/i.test(out), out.slice(0, 160))

  out = await send(`${prefix}menu ai`)
  check('.menu ai muestra una categoría concreta', /ᴄʜᴀᴛ|ᴀsᴋ|ᴀꜱᴋ/i.test(out), out.slice(0, 160))

  /* 3. Silencios correctos */
  out = await send('hola, esto no es un comando')
  check('un mensaje normal no provoca respuesta', out === '')

  out = await send(`${prefix}comandoquenoexiste`)
  check('un comando inexistente no provoca respuesta', out === '')

  /* 4. Validación de argumentos */
  out = await send(`${prefix}weather`)
  check('faltan argumentos: responde con el uso', out.includes('<ciudad>'), out.slice(0, 160))

  /* 5. Servicios sin configurar */
  if (!config.keys.openai) {
    out = await send(`${prefix}chat hola`)
    check('servicio sin API key avisa al usuario', out.includes('⚠️ Este servicio no está configurado.'), out.slice(0, 160))
  }

  /* 6. Permisos */
  out = await send(`${prefix}restart`, { from: USER })
  check('comando de owner bloqueado para un usuario', /owner|propietario/i.test(out), out.slice(0, 160))

  out = await send(`${prefix}kick @333333333333`, { from: USER, chat: GROUP })
  check('comando de admin bloqueado para un no-admin', /admin/i.test(out), out.slice(0, 160))

  /* 7. Modo privado */
  await send(`${prefix}private`, { from: OWNER })
  out = await send(`${prefix}ping`, { from: USER })
  check('modo privado: ignora a los usuarios normales', out === '')
  out = await send(`${prefix}ping`, { from: OWNER })
  check('modo privado: el owner sí puede usarlo', out !== '')
  await send(`${prefix}public`, { from: OWNER })
  out = await send(`${prefix}ping`, { from: USER })
  check('modo público: vuelve a responder a todos', out !== '')

  /* 8. Prefijo */
  await send(`${prefix}setprefix #`, { from: OWNER })
  out = await send('#ping')
  check('.setprefix cambia el prefijo', out !== '', out.slice(0, 120))
  out = await send(`${prefix}ping`)
  check('el prefijo antiguo deja de funcionar', out === '')
  check('el cambio de prefijo queda marcado como explícito', db.settings.prefixExplicit === true)
  setSetting('prefix', prefix)

  /* 9. Grupos y economía */
  out = await send(`${prefix}perfil`, { from: USER, chat: GROUP })
  check('.perfil funciona en grupo', /XP|ɴɪᴠᴇʟ|Nivel|Rol/i.test(out), out.slice(0, 160))

  out = await send(`${prefix}daily`, { from: USER })
  check('.daily entrega la recompensa', /recompensa|diaria|💰|monedas/i.test(out), out.slice(0, 160))
  out = await send(`${prefix}daily`, { from: USER })
  check('.daily respeta el tiempo de espera', /vuelve|espera|ya reclamaste|⏳/i.test(out), out.slice(0, 160))

  /* 10. Aislamiento de errores */
  const broken = {
    name: '__selftest_boom',
    aliases: [],
    category: 'main',
    args: '',
    description: 'prueba',
    exec: async () => { throw new Error('fallo simulado') }
  }
  registry.commands.set(broken.name, broken)
  out = await send(`${prefix}__selftest_boom`)
  check('un comando que falla no tumba el bot', /error/i.test(out) && !/fallo simulado/.test(out), out.slice(0, 160))
  registry.commands.delete(broken.name)

  out = await send(`${prefix}ping`)
  check('el bot sigue respondiendo tras el error', out !== '')

  /* 11. Usuario registrado */
  const user = getUser(USER)
  check('la base de datos registra al usuario', user.messages > 0 && user.xp > 0)

  /* ─── Limpieza ─── */
  db.close?.()
  await fsp.rm(DB_FILE, { force: true })
  if (hadDb) {
    await fsp.copyFile(DB_BACKUP, DB_FILE)
    await fsp.rm(DB_BACKUP, { force: true })
  }

  console.log(`\n${c.bold}──────────────────────────────${c.reset}`)
  if (failed === 0) {
    console.log(`${c.green}${c.bold}${passed}/${passed} pruebas superadas.${c.reset} El bot funciona correctamente.\n`)
  } else {
    console.log(`${c.red}${c.bold}${failed} prueba(s) fallidas${c.reset} de ${passed + failed}.\n`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(`\n${c.red}❌ El autotest falló:${c.reset} ${error.message}`)
  console.error(error.stack)
  process.exitCode = 1
})
