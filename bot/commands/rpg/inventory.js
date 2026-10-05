/** Muestra el inventario del usuario. */
import { ITEMS } from '../../lib/rpgdata.js'
import { formatNumber } from '../../lib/functions.js'

export default {
  name: 'inventory',
  aliases: ['inventario', 'inv', 'mochila'],
  category: 'rpg',
  args: '',
  description: 'Ver tu inventario',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const entries = Object.entries(user.inventory).filter(([, amount]) => amount > 0)
    const lines = entries.length
      ? entries.map(([key, amount]) => `│ ${ITEMS[key]?.emoji || '📦'} ${ITEMS[key]?.name || key} ☇ *${formatNumber(amount)}*`).join('\n')
      : '│ _Vacío. Usa .mine o .hunt para conseguir objetos._'

    await m.reply(
      `╭─❏ *INVENTARIO DE ${(user.name || 'USUARIO').toUpperCase()}*\n` +
      `${lines}\n` +
      `├────────────\n` +
      `│ 💰 Monedas ☇ *${formatNumber(user.money)}*\n` +
      `│ 🏦 Banco ☇ *${formatNumber(user.bank)}*\n` +
      `│ ❤️ Salud ☇ *${user.rpg.health}/100*\n` +
      `╰━━━━━━━━━━━━━━━⬣`
    )
  }
}
