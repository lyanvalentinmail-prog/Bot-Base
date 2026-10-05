/** Ajusta el limite diario de un usuario. */
import { getUser, db } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'setlimit',
  aliases: ['darlimite'],
  category: 'owner',
  args: '<@usuario> <cantidad>',
  description: 'Fijar el límite diario de un usuario',
  example: 'setlimit @usuario 50',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, args }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) throw new UserError('👤 Menciona al usuario.\nEjemplo: *.setlimit @usuario 50*')

    const amount = parseInt(args.find((a) => /^\d+$/.test(a)) || '', 10)
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
      throw new UserError('🔢 Indica una cantidad válida (0-100000).')
    }

    const user = getUser(target)
    user.limit = amount
    db.data.users[user.id].limit = amount
    db.markDirty()

    await m.reply(`Ⓛ Límite de @${target.split('@')[0]} fijado en *${amount}*.`, { mentions: [target] })
  }
}
