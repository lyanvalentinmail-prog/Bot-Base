/** Activa o desactiva el antilink del grupo. */
import { db } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'antilink',
  aliases: ['antienlaces'],
  category: 'panel',
  args: '<on|off>',
  description: 'Activar o desactivar el antilink',
  example: 'antilink on',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  group: true,

  async exec ({ m, args, group }) {
    const option = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(option)) throw new UserError('⚙️ Uso: *.antilink on* o *.antilink off*')

    group.antilink = option === 'on'
    db.data.groups[group.id].antilink = group.antilink
    db.markDirty()

    await m.reply(
      group.antilink
        ? '🔗 *Antilink activado*: se expulsará a quien envíe enlaces de invitación a grupos (los admins quedan exentos).'
        : '🔗 *Antilink desactivado*.'
    )
  }
}
