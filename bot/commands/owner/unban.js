/** Desbanea a un usuario. */
import { unbanUser } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'unban',
  aliases: ['desbanear', 'desbloquear'],
  category: 'owner',
  args: '<@usuario>',
  description: 'Desbloquear a un usuario',
  example: 'unban @usuario',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, args }) {
    const target = m.mentionedJid[0] || m.quoted?.sender ||
      (args[0] && /^\d{8,16}$/.test(args[0].replace(/\D/g, '')) ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null)
    if (!target) throw new UserError('👤 Menciona al usuario o escribe su número.')

    unbanUser(target)
    await m.reply(`✅ @${target.split('@')[0]} ha sido *desbloqueado*.`, { mentions: [target] })
  }
}
