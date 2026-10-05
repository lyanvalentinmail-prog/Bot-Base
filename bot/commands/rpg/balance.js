/** Consulta el saldo propio o el de otra persona. */
import { getUser } from '../../database/index.js'
import { formatNumber } from '../../lib/functions.js'

export default {
  name: 'balance',
  aliases: ['bal', 'saldo', 'dinero'],
  category: 'rpg',
  args: '[@usuario]',
  description: 'Ver tu saldo de monedas',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const targetJid = m.mentionedJid[0] || m.quoted?.sender
    const target = targetJid ? getUser(targetJid) : user
    await m.reply(
      `💳 *SALDO*\n\n` +
      `👤 ${targetJid ? `@${targetJid.split('@')[0]}` : (user.name || 'Tú')}\n` +
      `💰 Monedas ☇ *${formatNumber(target.money)}*\n` +
      `🏦 Banco ☇ *${formatNumber(target.bank)}*\n` +
      `★ Nivel ☇ *${target.level}*`,
      targetJid ? { mentions: [targetJid] } : {}
    )
  }
}
