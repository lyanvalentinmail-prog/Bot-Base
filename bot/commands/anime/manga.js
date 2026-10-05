/** Buscar manga en Jikan (MyAnimeList). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { truncate } from '../../lib/functions.js'

export default {
  name: 'manga',
  aliases: ['mangasearch'],
  category: 'anime',
  args: '<nombre>',
  description: 'Buscar información de un manga',
  example: 'manga berserk',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m, text }) {
    const data = await apiGet('https://api.jikan.moe/v4/manga', {
      params: { q: text, limit: 1, sfw: true }
    }, 'Jikan (MyAnimeList)')

    const manga = data?.data?.[0]
    if (!manga) throw new UserError(`❌ No encontré el manga *${text}*.`)

    const caption =
      `╭─❏ *${manga.title}*\n` +
      `│ 📚 Tipo ☇ ${manga.type || '-'}\n` +
      `│ 📖 Capítulos ☇ ${manga.chapters || '?'} (${manga.volumes || '?'} tomos)\n` +
      `│ 📡 Estado ☇ ${manga.status || '-'}\n` +
      `│ ⭐ Puntuación ☇ ${manga.score || '-'}\n` +
      `│ 🏅 Ranking ☇ #${manga.rank || '-'}\n` +
      `│ 🎭 Géneros ☇ ${(manga.genres || []).map((g) => g.name).join(', ') || '-'}\n` +
      `│ ✍️ Autor ☇ ${(manga.authors || []).map((a) => a.name).join(', ') || '-'}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      `📖 *Sinopsis:*\n${truncate(manga.synopsis || 'Sin sinopsis.', 700)}\n\n🔗 ${manga.url}`

    const image = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url
    const file = image ? await fetchBuffer(image, {}, 'Jikan').catch(() => null) : null
    if (file?.buffer) await m.reply({ image: file.buffer, caption })
    else await m.reply(caption)
  }
}
