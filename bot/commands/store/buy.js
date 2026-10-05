/** Compra objetos de la tienda. */
import { ITEMS } from '../../lib/rpgdata.js'
import { addItem, addMoney } from '../../database/index.js'
import { formatNumber } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'buy',
  aliases: ['comprar'],
  category: 'store',
  args: '<objeto> [cantidad]',
  description: 'Comprar un objeto de la tienda',
  example: 'buy potion 3',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user, args, prefix }) {
    const key = (args[0] || '').toLowerCase()
    const amount = Math.max(1, Math.min(999, parseInt(args[1], 10) || 1))
    const item = ITEMS[key]
    if (!item) throw new UserError(`🛒 Ese objeto no existe. Mira el catálogo con *${prefix}shop*.`)

    const total = item.buy * amount
    if (user.money < total) {
      throw new UserError(`💸 Te faltan ${formatNumber(total - user.money)} monedas (coste: ${formatNumber(total)}).`)
    }

    addMoney(user, -total)
    addItem(user, key, amount)

    await m.reply(
      `✅ *Compra realizada*\n\n` +
      `${item.emoji} ${item.name} ×${amount}\n` +
      `💸 -${formatNumber(total)} monedas\n` +
      `💳 Saldo ☇ ${formatNumber(user.money)}`
    )
  }
}
