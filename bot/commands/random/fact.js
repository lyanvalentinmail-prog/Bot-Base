/** Dato curioso aleatorio (Useless Facts API). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'dato',
  aliases: ['fact', 'curiosidad'],
  category: 'random',
  args: '',
  description: 'Un dato curioso aleatorio',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m }) {
    const data = await apiGet('https://uselessfacts.jsph.pl/api/v2/facts/random', {
      params: { language: 'en' }
    }, 'Useless Facts')
    if (!data?.text) throw new UserError('❌ No se obtuvo ningún dato.')
    await m.reply(`🧠 *Dato curioso*\n\n${data.text}\n\n_Fuente: uselessfacts.jsph.pl_`)
  }
}
