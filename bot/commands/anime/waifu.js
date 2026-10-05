/** Imagenes SFW de waifu.pics (API publica documentada). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

const CATEGORIES = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'happy', 'wink', 'poke', 'dance', 'cringe']

export default {
  name: 'waifu',
  aliases: ['animeimg'],
  category: 'anime',
  args: '[categoría]',
  description: 'Imagen aleatoria de anime (SFW)',
  example: 'waifu megumin',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m, args }) {
    const category = (args[0] || 'waifu').toLowerCase()
    if (!CATEGORIES.includes(category)) {
      throw new UserError(`✿ Categorías disponibles:\n\n${CATEGORIES.join(' · ')}`)
    }

    const data = await apiGet(`https://api.waifu.pics/sfw/${category}`, {}, 'waifu.pics')
    if (!data?.url) throw new UserError('❌ No se obtuvo ninguna imagen.')

    const { buffer } = await fetchBuffer(data.url, {}, 'waifu.pics')
    await m.reply({ image: buffer, caption: `✿ *${category}* · waifu.pics` })
  }
}
