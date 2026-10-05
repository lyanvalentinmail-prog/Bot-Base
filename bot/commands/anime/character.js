/** Buscar personajes de anime en Jikan. */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { truncate } from '../../lib/functions.js'

export default {
  name: 'personaje',
  aliases: ['character', 'char'],
  category: 'anime',
  args: '<nombre>',
  description: 'Buscar un personaje de anime',
  example: 'personaje levi ackerman',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m, text }) {
    const data = await apiGet('https://api.jikan.moe/v4/characters', {
      params: { q: text, limit: 1 }
    }, 'Jikan (MyAnimeList)')

    const character = data?.data?.[0]
    if (!character) throw new UserError(`❌ No encontré al personaje *${text}*.`)

    const caption =
      `✿ *${character.name}*\n` +
      (character.name_kanji ? `🇯🇵 ${character.name_kanji}\n` : '') +
      `❤️ Favoritos ☇ ${(character.favorites || 0).toLocaleString('es-ES')}\n` +
      (character.nicknames?.length ? `🏷️ Apodos ☇ ${character.nicknames.slice(0, 4).join(', ')}\n` : '') +
      `\n${truncate(character.about || 'Sin descripción.', 800)}\n\n🔗 ${character.url}`

    const image = character.images?.jpg?.image_url
    const file = image ? await fetchBuffer(image, {}, 'Jikan').catch(() => null) : null
    if (file?.buffer) await m.reply({ image: file.buffer, caption })
    else await m.reply(caption)
  }
}
