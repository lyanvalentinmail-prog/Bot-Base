/** Silencia al bot en el grupo (deja de responder a los no administradores). */
import { db } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'mute',
  aliases: ['silenciar', 'unmute'],
  category: 'panel',
  args: '<on|off>',
  description: 'Silenciar o reactivar el bot en el grupo',
  example: 'mute on',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  group: true,

  async exec ({ m, args, group }) {
    const option = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(option)) throw new UserError('⚙️ Uso: *.mute on* o *.mute off*')

    group.mute = option === 'on'
    db.data.groups[group.id].mute = group.mute
    db.markDirty()

    await m.reply(
      group.mute
        ? '🔇 Bot *silenciado* en este grupo. Solo responderá a administradores y al propietario.'
        : '🔊 Bot *reactivado* en este grupo.'
    )
  }
}
