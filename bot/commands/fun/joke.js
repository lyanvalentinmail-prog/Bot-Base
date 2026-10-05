/** Chiste aleatorio (JokeAPI, https://jokeapi.dev). */
import { apiGet } from '../../lib/apiClient.js'

export default {
  name: 'chiste',
  aliases: ['joke'],
  category: 'fun',
  args: '',
  description: 'Contar un chiste aleatorio',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 5,

  async exec ({ m }) {
    const data = await apiGet('https://v2.jokeapi.dev/joke/Any', {
      params: { lang: 'es', blacklistFlags: 'nsfw,racist,sexist,explicit', format: 'json' }
    }, 'JokeAPI')

    if (data?.error) {
      await m.reply('😅 No encontré ningún chiste ahora mismo, inténtalo de nuevo.')
      return
    }

    const text = data.type === 'single'
      ? data.joke
      : `${data.setup}\n\n...${data.delivery}`

    await m.reply(`😄 *Chiste* (${data.category})\n\n${text}`)
  }
}
