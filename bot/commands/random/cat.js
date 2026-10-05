/** Foto aleatoria de un gato (TheCatAPI, uso publico). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'gato',
  aliases: ['cat', 'michi'],
  category: 'random',
  args: '',
  description: 'Foto aleatoria de un gato',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m }) {
    const data = await apiGet('https://api.thecatapi.com/v1/images/search', {}, 'TheCatAPI')
    const url = data?.[0]?.url
    if (!url) throw new UserError('❌ No se obtuvo ninguna imagen.')
    const { buffer } = await fetchBuffer(url, {}, 'TheCatAPI')
    await m.reply({ image: buffer, caption: '🐱 *Miau*' })
  }
}
