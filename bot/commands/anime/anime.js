/** Buscar anime en Jikan (API no oficial pero publica y documentada de MyAnimeList). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { truncate } from '../../lib/functions.js'

export default {
  name: 'anime',
  aliases: ['animesearch', 'mal'],
  category: 'anime',
  args: '<nombre>',
  description: 'Buscar información de un anime',
  example: 'anime steins gate',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m, text }) {
    await m.react('✿')
    const data = await apiGet('https://api.jikan.moe/v4/anime', {
      params: { q: text, limit: 1, sfw: true }
    }, 'Jikan (MyAnimeList)')

    const anime = data?.data?.[0]
    if (!anime) throw new UserError(`❌ No encontré el anime *${text}*.`)

    const caption =
      `╭─❏ *${anime.title}*\n` +
      (anime.title_japanese ? `│ 🇯🇵 ${anime.title_japanese}\n` : '') +
      `│ 🎬 Tipo ☇ ${anime.type || '-'}\n` +
      `│ 📺 Episodios ☇ ${anime.episodes || '?'}\n` +
      `│ 📡 Estado ☇ ${anime.status || '-'}\n` +
      `│ ⭐ Puntuación ☇ ${anime.score || '-'} (${(anime.scored_by || 0).toLocaleString('es-ES')} votos)\n` +
      `│ 🏅 Ranking ☇ #${anime.rank || '-'}\n` +
      `│ 🎭 Géneros ☇ ${(anime.genres || []).map((g) => g.name).join(', ') || '-'}\n` +
      `│ 📅 Emisión ☇ ${anime.aired?.string || '-'}\n` +
      `│ 🏢 Estudio ☇ ${(anime.studios || []).map((s) => s.name).join(', ') || '-'}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      `📖 *Sinopsis:*\n${truncate(anime.synopsis || 'Sin sinopsis.', 700)}\n\n🔗 ${anime.url}`

    const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url
    const file = image ? await fetchBuffer(image, {}, 'Jikan').catch(() => null) : null
    if (file?.buffer) await m.reply({ image: file.buffer, caption })
    else await m.reply(caption)
  }
}
