/** Perfil publico de Reddit (JSON oficial de reddit.com). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { formatDate, formatNumber } from '../../lib/functions.js'

export default {
  name: 'redditstalk',
  aliases: ['reddituser'],
  category: 'stalk',
  args: '<usuario>',
  description: 'Ver el perfil público de un usuario de Reddit',
  example: 'redditstalk spez',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const username = text.trim().replace(/^(u\/|\/u\/|@)/, '')
    if (!/^[\w-]{3,20}$/.test(username)) throw new UserError('❌ Nombre de usuario de Reddit no válido.')

    let data
    try {
      data = await apiGet(`https://www.reddit.com/user/${username}/about.json`, {}, 'Reddit')
    } catch {
      throw new UserError(`❌ El usuario *u/${username}* no existe o es privado.`)
    }

    const info = data?.data
    if (!info) throw new UserError('❌ Reddit no devolvió datos del usuario.')

    await m.reply(
      `╭─❏ *REDDIT · u/${info.name}*\n` +
      `│ 🏆 Karma de posts ☇ ${formatNumber(info.link_karma)}\n` +
      `│ 💬 Karma de comentarios ☇ ${formatNumber(info.comment_karma)}\n` +
      `│ ✅ Verificado ☇ ${info.verified ? 'sí' : 'no'}\n` +
      `│ 🥇 Premium ☇ ${info.is_gold ? 'sí' : 'no'}\n` +
      `│ 📅 Cuenta creada ☇ ${formatDate(info.created_utc * 1000, false)}\n` +
      `│ 🔗 https://reddit.com/user/${info.name}\n` +
      `╰━━━━━━━━━━━━━━━⬣`
    )
  }
}
