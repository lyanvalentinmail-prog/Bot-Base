/** Informacion de un paquete npm (registro oficial). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { formatDate, truncate } from '../../lib/functions.js'

export default {
  name: 'npmstalk',
  aliases: ['npm', 'npminfo'],
  category: 'stalk',
  args: '<paquete>',
  description: 'Ver información de un paquete npm',
  example: 'npmstalk baileys',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const name = text.trim().toLowerCase()
    let data
    try {
      data = await apiGet(`https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}`, {}, 'npm')
    } catch {
      throw new UserError(`❌ El paquete *${name}* no existe en npm.`)
    }

    const latest = data['dist-tags']?.latest
    const version = data.versions?.[latest] || {}
    const downloads = await apiGet(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`, {}, 'npm'
    ).catch(() => null)

    await m.reply(
      `╭─❏ *NPM · ${data.name}*\n` +
      `│ 🏷️ Última versión ☇ ${latest}\n` +
      `│ 📝 ${truncate(data.description || '-', 200)}\n` +
      `│ 📜 Licencia ☇ ${version.license || data.license || '-'}\n` +
      `│ 👤 Autor ☇ ${data.author?.name || '-'}\n` +
      `│ 📅 Publicado ☇ ${formatDate(data.time?.[latest], false)}\n` +
      `│ ⬇️ Descargas (7d) ☇ ${(downloads?.downloads || 0).toLocaleString('es-ES')}\n` +
      `│ 🔗 https://www.npmjs.com/package/${data.name}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      `📥 \`\`\`npm install ${data.name}\`\`\``
    )
  }
}
