/** Meme aleatorio de Reddit (Meme API publica: https://github.com/D3vd/Meme_Api). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'

export default {
  name: 'meme',
  aliases: ['memes'],
  category: 'fun',
  args: '[subreddit]',
  description: 'Enviar un meme aleatorio',
  example: 'meme dankmemes',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 5,

  async exec ({ m, args }) {
    const subreddit = (args[0] || '').replace(/[^\w]/g, '')
    const url = subreddit ? `https://meme-api.com/gimme/${subreddit}` : 'https://meme-api.com/gimme'
    const data = await apiGet(url, {}, 'Meme API')

    if (!data?.url) {
      await m.reply('😕 No se encontró ningún meme.')
      return
    }
    if (data.nsfw) {
      await m.reply('🔞 El meme obtenido es NSFW, se descartó. Prueba otra vez.')
      return
    }

    const { buffer } = await fetchBuffer(data.url, {}, 'Meme API')
    await m.reply({
      image: buffer,
      caption: `😂 *${data.title}*\n\n📍 r/${data.subreddit} · 👍 ${data.ups ?? 0}`
    })
  }
}
