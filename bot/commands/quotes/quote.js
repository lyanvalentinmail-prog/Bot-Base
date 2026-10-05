/** Cita celebre aleatoria (dataset local, siempre disponible). */
import { pickRandom } from '../../lib/functions.js'
import { QUOTES } from './_data.js'

export default {
  name: 'quote',
  aliases: ['cita', 'frase'],
  category: 'quotes',
  args: '',
  description: 'Enviar una cita célebre',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    const quote = pickRandom(QUOTES)
    await m.reply(`❝ ${quote.text} ❞\n\n— *${quote.author}*`)
  }
}
