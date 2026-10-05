/** Geolocalizacion de una IP o dominio (ipapi.co, plan gratuito). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ip',
  aliases: ['iplookup', 'ipinfo'],
  category: 'tools',
  args: '<ip>',
  description: 'Consultar información pública de una IP',
  example: 'ip 8.8.8.8',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const target = text.trim()
    if (!/^[\w.:-]+$/.test(target)) throw new UserError('❌ Introduce una IP válida.')

    const data = await apiGet(`https://ipapi.co/${encodeURIComponent(target)}/json/`, {}, 'ipapi.co')
    if (data?.error) throw new UserError(`❌ ${data.reason || 'IP no encontrada'}`)

    await m.reply(
      `╭─❏ *INFORMACIÓN DE IP*\n` +
      `│ 🌐 IP ☇ ${data.ip}\n` +
      `│ 🏙️ Ciudad ☇ ${data.city || '-'}\n` +
      `│ 🗺️ Región ☇ ${data.region || '-'}\n` +
      `│ 🏳️ País ☇ ${data.country_name || '-'} (${data.country_code || '-'})\n` +
      `│ 📮 Código postal ☇ ${data.postal || '-'}\n` +
      `│ 🕒 Zona horaria ☇ ${data.timezone || '-'}\n` +
      `│ 🏢 Proveedor ☇ ${data.org || '-'}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n_Datos públicos de ipapi.co_`
    )
  }
}
