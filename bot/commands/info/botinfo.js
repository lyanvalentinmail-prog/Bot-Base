/** Ficha tecnica del bot. */
import os from 'node:os'
import config from '../../config.js'
import { formatUptime, formatBytes, formatNumber } from '../../lib/functions.js'
import { db } from '../../database/index.js'
import { hasBinary } from '../../lib/binaries.js'

export default {
  name: 'botinfo',
  aliases: ['infobot', 'stats', 'estado'],
  category: 'info',
  args: '',
  description: 'Información y estadísticas del bot',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, registry, runtime, settings }) {
    const users = Object.keys(db.users).length
    const groups = Object.keys(db.groups).length
    const premium = Object.values(db.users).filter((u) => u.premium).length

    await m.reply(
      `╭──( *${config.botName}* )\n` +
      `║🎌 Versión ☇ *${config.botVersion}*\n` +
      `│⛩️ Propietario ☇ *${config.ownerName}*\n` +
      `║🏮 Prefijo ☇ *${settings.prefix}*\n` +
      `│🍡 Modo ☇ *${settings.mode === 'private' ? 'Privado' : 'Público'}*\n` +
      `║🎴 Comandos ☇ *${registry.total}* en *${registry.byCategory().size}* categorías\n` +
      `│🎐 Activo ☇ *${formatUptime(Date.now() - (runtime?.startedAt || Date.now()))}*\n` +
      `║🍙 Usuarios ☇ *${formatNumber(users)}* (premium: ${premium})\n` +
      `│🎋 Grupos ☇ *${formatNumber(groups)}*\n` +
      `║🗾 Comandos usados ☇ *${formatNumber(db.settings.totalCommands || 0)}*\n` +
      `╰━━━━━━━━━━━━━━━━━━━⬣\n\n` +
      `╭─❏ *SISTEMA*\n` +
      `│ 🖥️ ${os.type()} ${os.arch()}\n` +
      `│ 🟩 Node ${process.versions.node}\n` +
      `│ 🧠 RAM ${formatBytes(os.totalmem() - os.freemem())} / ${formatBytes(os.totalmem())}\n` +
      `│ 📦 Proceso ${formatBytes(process.memoryUsage().rss)}\n` +
      `│ 🎞️ ffmpeg ${hasBinary('ffmpeg') ? '✅' : '❌'}  ·  yt-dlp ${hasBinary('yt-dlp') ? '✅' : '❌'}\n` +
      `╰━━━━━━━━━━━━━━━⬣`
    )
  }
}
