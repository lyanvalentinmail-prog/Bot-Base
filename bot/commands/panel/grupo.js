/** Abre o cierra el grupo (quien puede enviar mensajes). */
import { UserError } from '../../lib/errors.js'

export default {
  name: 'grupo',
  aliases: ['group', 'abrir', 'cerrar'],
  category: 'panel',
  args: '<abrir|cerrar>',
  description: 'Abrir o cerrar el grupo',
  example: 'grupo cerrar',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  botAdmin: true,
  group: true,

  async exec ({ sock, m, args, commandName }) {
    const option = (args[0] || commandName || '').toLowerCase()
    if (['abrir', 'open'].includes(option)) {
      await sock.groupSettingUpdate(m.chat, 'not_announcement')
      await m.reply('🔓 Grupo *abierto*: todos pueden escribir.')
    } else if (['cerrar', 'close'].includes(option)) {
      await sock.groupSettingUpdate(m.chat, 'announcement')
      await m.reply('🔒 Grupo *cerrado*: solo los administradores pueden escribir.')
    } else {
      throw new UserError('⚙️ Uso: *.grupo abrir* o *.grupo cerrar*')
    }
  }
}
