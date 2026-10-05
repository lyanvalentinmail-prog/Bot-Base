/** Perfil publico de GitHub (API REST oficial). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { formatDate, formatNumber } from '../../lib/functions.js'

export default {
  name: 'githubstalk',
  aliases: ['ghstalk', 'github'],
  category: 'stalk',
  args: '<usuario>',
  description: 'Ver el perfil público de un usuario de GitHub',
  example: 'githubstalk torvalds',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const username = text.trim().replace(/^@/, '')
    if (!/^[\w-]{1,39}$/.test(username)) throw new UserError('❌ Nombre de usuario de GitHub no válido.')

    let data
    try {
      data = await apiGet(`https://api.github.com/users/${username}`, {
        headers: { Accept: 'application/vnd.github+json' }
      }, 'GitHub')
    } catch {
      throw new UserError(`❌ El usuario *${username}* no existe en GitHub.`)
    }

    const caption =
      `╭─❏ *GITHUB · ${data.login}*\n` +
      `│ 👤 Nombre ☇ ${data.name || '-'}\n` +
      `│ 📝 Bio ☇ ${data.bio || '-'}\n` +
      `│ 🏢 Empresa ☇ ${data.company || '-'}\n` +
      `│ 📍 Ubicación ☇ ${data.location || '-'}\n` +
      `│ 📦 Repos ☇ ${formatNumber(data.public_repos)}\n` +
      `│ 👥 Seguidores ☇ ${formatNumber(data.followers)}\n` +
      `│ 🔗 Siguiendo ☇ ${formatNumber(data.following)}\n` +
      `│ 📅 Desde ☇ ${formatDate(data.created_at, false)}\n` +
      `│ 🌐 ${data.html_url}\n` +
      `╰━━━━━━━━━━━━━━━⬣`

    const avatar = await fetchBuffer(data.avatar_url, {}, 'GitHub').catch(() => null)
    if (avatar?.buffer) await m.reply({ image: avatar.buffer, caption })
    else await m.reply(caption)
  }
}
