/** Informacion de series de TV (API publica TVmaze). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { stripHtml, truncate } from '../../lib/functions.js'

export default {
  name: 'serie',
  aliases: ['tvshow', 'tvmaze'],
  category: 'search',
  args: '<nombre>',
  description: 'Buscar información de una serie de TV',
  example: 'serie breaking bad',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const data = await apiGet('https://api.tvmaze.com/singlesearch/shows', {
      params: { q: text }
    }, 'TVmaze').catch(() => null)

    if (!data) throw new UserError(`❌ No encontré la serie *${text}*.`)

    const caption =
      `╭─❏ *${data.name}*\n` +
      `│ 📺 Tipo ☇ ${data.type || '-'}\n` +
      `│ 🎭 Géneros ☇ ${(data.genres || []).join(', ') || '-'}\n` +
      `│ 📡 Estado ☇ ${data.status || '-'}\n` +
      `│ ⭐ Puntuación ☇ ${data.rating?.average ?? '-'}\n` +
      `│ 📅 Estreno ☇ ${data.premiered || '-'}\n` +
      `│ ⏱️ Duración ☇ ${data.runtime ? `${data.runtime} min` : '-'}\n` +
      `│ 🌐 Cadena ☇ ${data.network?.name || data.webChannel?.name || '-'}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      `📖 ${truncate(stripHtml(data.summary || 'Sin sinopsis.'), 700)}\n\n🔗 ${data.url}`

    const image = data.image?.original || data.image?.medium
    const file = image ? await fetchBuffer(image, {}, 'TVmaze').catch(() => null) : null
    if (file?.buffer) await m.reply({ image: file.buffer, caption })
    else await m.reply(caption)
  }
}
