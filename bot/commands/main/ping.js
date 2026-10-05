/** Latencia y estado rapido del bot. */
import os from 'node:os'
import { performance } from 'node:perf_hooks'
import { formatUptime, formatBytes } from '../../lib/functions.js'

export default {
  name: 'ping',
  aliases: ['p', 'latencia'],
  category: 'main',
  args: '',
  description: 'Comprobar la latencia del bot',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, runtime }) {
    const start = performance.now()
    await m.react('🏓')
    const latency = performance.now() - start
    const memory = process.memoryUsage()

    await m.reply(
      `🏓 *Pong!*\n\n` +
      `⚡ Respuesta ☇ *${latency.toFixed(2)} ms*\n` +
      `🧠 Memoria ☇ *${formatBytes(memory.rss)}*\n` +
      `🖥️ Carga ☇ *${os.loadavg().map((n) => n.toFixed(2)).join(' / ')}*\n` +
      `⏱️ Activo ☇ *${formatUptime(Date.now() - (runtime?.startedAt || Date.now()))}*`
    )
  }
}
