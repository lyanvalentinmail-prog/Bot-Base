/** Quita el administrador a un miembro. */
import { UserError } from '../../lib/errors.js'
import { invalidate } from '../../lib/group.js'

export default {
  name: 'demote',
  aliases: ['degradar', 'quitaradmin'],
  category: 'panel',
  args: '<@usuario>',
  description: 'Quitar administrador a un miembro',
  example: 'demote @usuario',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  botAdmin: true,
  group: true,

  async exec ({ sock, m }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) throw new UserError('👤 Menciona a quien quieres degradar.')
    await sock.groupParticipantsUpdate(m.chat, [target], 'demote')
    invalidate(m.chat)
    await m.reply(`⬇️ @${target.split('@')[0]} ya no es administrador.`, { mentions: [target] })
  }
}
