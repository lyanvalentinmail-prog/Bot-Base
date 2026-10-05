/** Estadisticas internas de la base de datos. */
import fs from 'node:fs'
import path from 'node:path'
import config from '../../config.js'
import { db } from '../../database/index.js'
import { formatBytes, formatNumber } from '../../lib/functions.js'

export default {
  name: 'dbstats',
  aliases: ['database', 'bd'],
  category: 'owner',
  args: '',
  description: 'Ver estadísticas de la base de datos',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m }) {
    const file = path.join(config.paths.data, 'database.json')
    const size = fs.existsSync(file) ? fs.statSync(file).size : 0

    const users = Object.values(db.users)
    const top = Object.entries(db.data.stats.commands || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => `│ ${index + 1}. ${name} ☇ ${formatNumber(count)}`)
      .join('\n')

    await m.reply(
      `╭─❏ *BASE DE DATOS*\n` +
      `│ 📁 Archivo ☇ data/database.json\n` +
      `│ 📦 Tamaño ☇ ${formatBytes(size)}\n` +
      `│ 👥 Usuarios ☇ ${formatNumber(users.length)}\n` +
      `│ Ⓟ Premium ☇ ${users.filter((u) => u.premium).length}\n` +
      `│ 🚫 Baneados ☇ ${users.filter((u) => u.banned).length}\n` +
      `│ 👨‍👩‍👧 Grupos ☇ ${formatNumber(Object.keys(db.groups).length)}\n` +
      `│ ⌨️ Comandos usados ☇ ${formatNumber(db.settings.totalCommands || 0)}\n` +
      `│ 💬 Mensajes vistos ☇ ${formatNumber(db.data.stats.messages || 0)}\n` +
      `│ 🚫 Comandos bloqueados ☇ ${db.settings.disabledCommands.length || 0}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      (top ? `╭─❏ *TOP COMANDOS*\n${top}\n╰━━━━━━━━━━━━━━━⬣` : '')
    )
  }
}
