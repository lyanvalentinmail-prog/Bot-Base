/** Retira el premium a un usuario. */
import { removePremium } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'delprem',
  aliases: ['delpremium', 'quitarpremium'],
  category: 'owner',
  args: '<@usuario>',
  description: 'Retirar el premium a un usuario',
  example: 'delprem @usuario',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, args }) {
    const target = m.mentionedJid[0] || m.quoted?.sender ||
      (args[0] && /^\d{8,16}$/.test(args[0].replace(/\D/g, '')) ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null)
    if (!target) throw new UserError('👤 Menciona al usuario o escribe su número.')

    removePremium(target)
    await m.reply(`✅ Se retiró el premium a @${target.split('@')[0]}.`, { mentions: [target] })
  }
}
