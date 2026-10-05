/** Cambia el bot a modo publico. */
import { setSetting } from '../../database/index.js'

export default {
  name: 'public',
  aliases: ['publico'],
  category: 'owner',
  args: '',
  description: 'Poner el bot en modo público',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m }) {
    setSetting('mode', 'public')
    await m.reply('🌍 Bot en modo *PÚBLICO*: cualquiera puede usar los comandos.')
  }
}
