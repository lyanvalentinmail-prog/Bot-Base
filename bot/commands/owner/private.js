/** Cambia el bot a modo privado. */
import { setSetting } from '../../database/index.js'

export default {
  name: 'private',
  aliases: ['privado'],
  category: 'owner',
  args: '',
  description: 'Poner el bot en modo privado',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m }) {
    setSetting('mode', 'private')
    await m.reply('🔒 Bot en modo *PRIVADO*: solo el propietario puede usar los comandos.')
  }
}
