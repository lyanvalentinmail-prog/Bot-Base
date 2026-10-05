/** Configura los mensajes de bienvenida y despedida. */
import { db } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'welcome',
  aliases: ['bienvenida'],
  category: 'panel',
  args: '<on|off|texto> [mensaje]',
  description: 'Configurar la bienvenida del grupo',
  example: 'welcome texto ¡Hola @user, bienvenido a @group!',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  group: true,

  async exec ({ m, args, group, prefix }) {
    const option = (args[0] || '').toLowerCase()

    if (option === 'on' || option === 'off') {
      group.welcome = option === 'on'
      db.data.groups[group.id].welcome = group.welcome
      db.markDirty()
      await m.reply(`👋 Bienvenidas *${group.welcome ? 'activadas' : 'desactivadas'}*.`)
      return
    }

    if (option === 'texto' || option === 'text') {
      const text = args.slice(1).join(' ')
      if (!text) throw new UserError('✏️ Escribe el mensaje.\nVariables: *@user* y *@group*')
      group.welcomeText = text
      db.data.groups[group.id].welcomeText = text
      db.markDirty()
      await m.reply(`✅ Mensaje de bienvenida actualizado:\n\n${text}`)
      return
    }

    if (option === 'despedida' || option === 'bye') {
      const text = args.slice(1).join(' ')
      if (!text) throw new UserError('✏️ Escribe el mensaje de despedida.')
      group.byeText = text
      db.data.groups[group.id].byeText = text
      db.markDirty()
      await m.reply(`✅ Mensaje de despedida actualizado:\n\n${text}`)
      return
    }

    throw new UserError(
      `⚙️ Uso:\n` +
      `• *${prefix}welcome on|off*\n` +
      `• *${prefix}welcome texto <mensaje>*\n` +
      `• *${prefix}welcome despedida <mensaje>*\n\n` +
      `Variables: *@user* (quien entra) y *@group* (nombre del grupo)\n\n` +
      `Estado actual: ${group.welcome ? 'activadas ✅' : 'desactivadas ❌'}`
    )
  }
}
