/** Foto aleatoria de un perro (Dog CEO API, documentada y gratuita). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'perro',
  aliases: ['dog', 'doggo'],
  category: 'random',
  args: '',
  description: 'Foto aleatoria de un perro',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m }) {
    const data = await apiGet('https://dog.ceo/api/breeds/image/random', {}, 'Dog CEO')
    if (data?.status !== 'success' || !data.message) throw new UserError('❌ No se obtuvo ninguna imagen.')
    const { buffer } = await fetchBuffer(data.message, {}, 'Dog CEO')
    await m.reply({ image: buffer, caption: '🐶 *Guau*' })
  }
}
