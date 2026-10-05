/** Transfiere monedas a otro usuario. */
import { getUser, addMoney } from '../../database/index.js'
import { formatNumber } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'pay',
  aliases: ['pagar', 'transferir'],
  category: 'rpg',
  args: '<@usuario> <cantidad>',
  description: 'Transferir monedas a otro usuario',
  example: 'pay @amigo 500',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  group: true,

  async exec ({ m, user, args }) {
    const targetJid = m.mentionedJid[0] || m.quoted?.sender
    if (!targetJid) throw new UserError('👤 Menciona a quien quieres pagar.\nEjemplo: *.pay @amigo 500*')
    if (targetJid === m.sender) throw new UserError('🙃 No puedes pagarte a ti mismo.')

    const amount = parseInt(args.find((a) => /^\d+$/.test(a)) || '0', 10)
    if (!amount || amount < 1) throw new UserError('💰 Indica una cantidad válida.\nEjemplo: *.pay @amigo 500*')
    if (user.money < amount) throw new UserError(`💸 Solo tienes ${formatNumber(user.money)} monedas.`)

    const target = getUser(targetJid)
    addMoney(user, -amount)
    addMoney(target, amount)

    await m.reply(
      `✅ *Transferencia realizada*\n\n` +
      `💸 ${formatNumber(amount)} monedas ➜ @${targetJid.split('@')[0]}\n` +
      `💳 Tu saldo ☇ ${formatNumber(user.money)}`,
      { mentions: [targetJid] }
    )
  }
}
