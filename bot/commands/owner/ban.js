/** Banea a un usuario del bot. */
import config from '../../config.js'
import { banUser, userKey } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ban',
  aliases: ['banear', 'bloquear'],
  category: 'owner',
  args: '<@usuario> [motivo]',
  description: 'Bloquear a un usuario del bot',
  example: 'ban @usuario spam',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, args }) {
    const target = m.mentionedJid[0] || m.quoted?.sender ||
      (args[0] && /^\d{8,16}$/.test(args[0].replace(/\D/g, '')) ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null)
    if (!target) throw new UserError('👤 Menciona al usuario o escribe su número.\nEjemplo: *.ban @usuario spam*')
    if (config.ownerNumbers.includes(userKey(target))) throw new UserError('👑 No puedes banear al propietario.')

    const reason = args.filter((a) => !a.startsWith('@')).slice(1).join(' ') || 'sin motivo'
    banUser(target, reason)
    await m.reply(`🚫 @${target.split('@')[0]} ha sido *bloqueado*.\n📝 Motivo: ${reason}`, { mentions: [target] })
  }
}
