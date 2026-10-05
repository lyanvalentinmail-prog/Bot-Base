/** Expulsa a un miembro del grupo. */
import { UserError } from '../../lib/errors.js'
import { invalidate } from '../../lib/group.js'

export default {
  name: 'kick',
  aliases: ['expulsar', 'echar'],
  category: 'panel',
  args: '<@usuario>',
  description: 'Expulsar a un miembro del grupo',
  example: 'kick @usuario',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  botAdmin: true,
  group: true,

  async exec ({ sock, m, metadata }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) throw new UserError('👤 Menciona a quien quieres expulsar.\nEjemplo: *.kick @usuario*')
    if (target === m.botJid) throw new UserError('🤖 No puedo expulsarme a mí mismo.')

    const isTargetAdmin = metadata?.participants?.some(
      (p) => p.id === target && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (isTargetAdmin) throw new UserError('⚠️ No puedo expulsar a un administrador.')

    await sock.groupParticipantsUpdate(m.chat, [target], 'remove')
    invalidate(m.chat)
    await m.reply(`👋 @${target.split('@')[0]} ha sido expulsado del grupo.`, { mentions: [target] })
  }
}
