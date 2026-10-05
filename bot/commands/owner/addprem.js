/** Concede premium a un usuario. */
import { setPremium } from '../../database/index.js'
import { formatDate } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'addprem',
  aliases: ['addpremium', 'darpremium'],
  category: 'owner',
  args: '<@usuario> [días]',
  description: 'Conceder premium a un usuario',
  example: 'addprem @usuario 30',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, args }) {
    const target = m.mentionedJid[0] || m.quoted?.sender ||
      (args[0] && /^\d{8,16}$/.test(args[0].replace(/\D/g, '')) ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null)
    if (!target) throw new UserError('👤 Menciona al usuario o escribe su número.\nEjemplo: *.addprem @usuario 30*')

    const days = Math.min(3650, Math.max(1, parseInt(args.find((a) => /^\d{1,4}$/.test(a)) || '30', 10)))
    const until = setPremium(target, days)

    await m.reply(
      `Ⓟ @${target.split('@')[0]} ahora es *PREMIUM*\n\n⏳ Duración ☇ ${days} días\n📅 Hasta ☇ ${formatDate(until, false)}`,
      { mentions: [target] }
    )
  }
}
