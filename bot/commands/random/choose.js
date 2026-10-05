/** Elige una opcion al azar entre varias separadas por coma. */
import { pickRandom } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'elige',
  aliases: ['choose', 'pick'],
  category: 'random',
  args: '<opción1, opción2, ...>',
  description: 'Elegir al azar entre varias opciones',
  example: 'elige pizza, tacos, sushi',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const options = text.split(/[,|]/).map((o) => o.trim()).filter(Boolean)
    if (options.length < 2) throw new UserError('🎲 Dame al menos dos opciones separadas por comas.\nEjemplo: *.elige pizza, tacos, sushi*')
    await m.reply(`🎲 Entre ${options.length} opciones elijo...\n\n✨ *${pickRandom(options)}*`)
  }
}
