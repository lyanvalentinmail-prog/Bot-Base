/** Tiempo que lleva encendido el bot. */
import { formatUptime } from '../../lib/functions.js'

export default {
  name: 'runtime',
  aliases: ['uptime', 'tiempo'],
  category: 'info',
  args: '',
  description: 'Tiempo que lleva activo el bot',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, runtime }) {
    const since = runtime?.startedAt || Date.now()
    await m.reply(
      `🎐 *Tiempo activo:* ${formatUptime(Date.now() - since)}\n` +
      `🔌 *Estado:* ${runtime?.status || 'Activo'}\n` +
      (runtime?.reconnects ? `♻️ *Reconexiones:* ${runtime.reconnects}\n` : '')
    )
  }
}
