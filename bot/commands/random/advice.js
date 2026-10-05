/** Consejo aleatorio (Advice Slip API). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'consejo',
  aliases: ['advice'],
  category: 'random',
  args: '',
  description: 'Recibir un consejo aleatorio',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m }) {
    const data = await apiGet('https://api.adviceslip.com/advice', {
      headers: { Accept: 'application/json' },
      params: { t: Date.now() }
    }, 'Advice Slip')

    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    const advice = parsed?.slip?.advice
    if (!advice) throw new UserError('❌ No se obtuvo ningún consejo.')
    await m.reply(`💡 *Consejo #${parsed.slip.id}*\n\n${advice}`)
  }
}
