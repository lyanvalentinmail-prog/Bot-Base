/** Frase motivacional aleatoria. */
import { pickRandom } from '../../lib/functions.js'
import { MOTIVATION } from './_data.js'

export default {
  name: 'motivacion',
  aliases: ['motivation', 'animo'],
  category: 'quotes',
  args: '',
  description: 'Recibir una frase motivacional',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    await m.reply(`💪 *Motivación del día*\n\n${pickRandom(MOTIVATION)}`)
  }
}
