/** Estado de las integraciones externas y de las herramientas del sistema. */
import { servicesStatus } from '../../lib/apiClient.js'
import { hasBinary, INSTALL_HINTS } from '../../lib/binaries.js'

export default {
  name: 'servicios',
  aliases: ['services', 'apis'],
  category: 'info',
  args: '',
  description: 'Ver qué servicios externos están configurados',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    const services = servicesStatus()
    const lines = services.map((s) => `│ ${s.ready ? '✅' : '⚠️'} ${s.name} ☇ _${s.env}_`)

    const binaries = ['ffmpeg', 'ffprobe', 'yt-dlp'].map((bin) => {
      const ok = hasBinary(bin)
      return `│ ${ok ? '✅' : '⚠️'} ${bin}${ok ? '' : ` ☇ _no instalado_`}`
    })

    await m.reply(
      `╭─❏ *SERVICIOS EXTERNOS*\n${lines.join('\n')}\n╰━━━━━━━━━━━━━━━⬣\n\n` +
      `╭─❏ *HERRAMIENTAS*\n${binaries.join('\n')}\n╰━━━━━━━━━━━━━━━⬣\n\n` +
      (services.every((s) => s.ready) && hasBinary('ffmpeg')
        ? '🎉 Todo está configurado.'
        : `ℹ️ Las claves se añaden en el archivo *.env*.\n${!hasBinary('ffmpeg') ? `\n🎞️ ffmpeg:\n${INSTALL_HINTS.ffmpeg}` : ''}`)
    )
  }
}
