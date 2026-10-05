/** Hace que el bot salga del grupo actual. */
import { sleep } from '../../lib/functions.js'

export default {
  name: 'leave',
  aliases: ['salir', 'salirgrupo'],
  category: 'owner',
  args: '',
  description: 'Sacar al bot del grupo actual',
  limit: false,
  premium: false,
  owner: true,
  admin: false,
  group: true,

  async exec ({ sock, m }) {
    await m.reply('👋 Saliendo del grupo. ¡Hasta luego!')
    await sleep(1000)
    await sock.groupLeave(m.chat)
  }
}
