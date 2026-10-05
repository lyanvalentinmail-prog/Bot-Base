/** Da administrador a un miembro. */
import { UserError } from '../../lib/errors.js'
import { invalidate } from '../../lib/group.js'

export default {
  name: 'promote',
  aliases: ['promover', 'daradmin'],
  category: 'panel',
  args: '<@usuario>',
  description: 'Dar administrador a un miembro',
  example: 'promote @usuario',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  botAdmin: true,
  group: true,

  async exec ({ sock, m }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) throw new UserError('👤 Menciona a quien quieres promover.')
    await sock.groupParticipantsUpdate(m.chat, [target], 'promote')
    invalidate(m.chat)
    await m.reply(`⬆️ @${target.split('@')[0]} ahora es administrador.`, { mentions: [target] })
  }
}
