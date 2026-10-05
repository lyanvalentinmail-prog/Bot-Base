/** Catalogo de la tienda. */
import { ITEMS } from '../../lib/rpgdata.js'
import { formatNumber } from '../../lib/functions.js'

export default {
  name: 'shop',
  aliases: ['tienda', 'store'],
  category: 'store',
  args: '',
  description: 'Ver el catálogo de la tienda',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user, prefix }) {
    const lines = Object.entries(ITEMS).map(([key, item]) =>
      `│ ${item.emoji} *${key}* · ${item.name}\n` +
      `│    💰 ${formatNumber(item.buy)}  ·  💵 venta ${formatNumber(item.sell)}\n` +
      `│    _${item.description}_`
    ).join('\n├────────────\n')

    await m.reply(
      `╭─❏ *TIENDA*\n${lines}\n╰━━━━━━━━━━━━━━━⬣\n\n` +
      `💳 Tu saldo ☇ *${formatNumber(user.money)}* monedas\n\n` +
      `🛒 Comprar ☇ *${prefix}buy <objeto> [cantidad]*\n` +
      `💵 Vender ☇ *${prefix}sell <objeto> [cantidad]*`
    )
  }
}
