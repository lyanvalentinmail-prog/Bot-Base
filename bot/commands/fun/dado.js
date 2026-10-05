/** Tira uno o varios dados. */
import { randomInt } from '../../lib/functions.js'

export default {
  name: 'dado',
  aliases: ['dice', 'roll'],
  category: 'fun',
  args: '[caras] [cantidad]',
  description: 'Tirar dados (por defecto 1d6)',
  example: 'dado 20 2',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const faces = Math.min(1000, Math.max(2, parseInt(args[0], 10) || 6))
    const count = Math.min(10, Math.max(1, parseInt(args[1], 10) || 1))
    const rolls = Array.from({ length: count }, () => randomInt(1, faces))
    const total = rolls.reduce((a, b) => a + b, 0)
    await m.reply(
      `🎲 *${count}d${faces}*\n\n` +
      `Resultados ☇ ${rolls.join(' · ')}\n` +
      (count > 1 ? `Total ☇ *${total}*` : `Sacaste un *${total}*`)
    )
  }
}
