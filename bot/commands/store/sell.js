/** Vende objetos del inventario. */
import { ITEMS } from '../../lib/rpgdata.js'
import { addItem, addMoney } from '../../database/index.js'
import { formatNumber } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'sell',
  aliases: ['vender'],
  category: 'store',
  args: '<objeto> [cantidad]',
  description: 'Vender un objeto del inventario',
  example: 'sell iron 5',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user, args, prefix }) {
    const key = (args[0] || '').toLowerCase()
    const amount = Math.max(1, Math.min(9999, parseInt(args[1], 10) || 1))
    const item = ITEMS[key]
    if (!item) throw new UserError(`💵 Ese objeto no existe. Mira el catálogo con *${prefix}shop*.`)
    if ((user.inventory[key] || 0) < amount) {
      throw new UserError(`🎒 Solo tienes ${formatNumber(user.inventory[key] || 0)} de ${item.name}.`)
    }

    const total = item.sell * amount
    addItem(user, key, -amount)
    addMoney(user, total)

    await m.reply(
      `✅ *Venta realizada*\n\n` +
      `${item.emoji} ${item.name} ×${amount}\n` +
      `💰 +${formatNumber(total)} monedas\n` +
      `💳 Saldo ☇ ${formatNumber(user.money)}`
    )
  }
}
