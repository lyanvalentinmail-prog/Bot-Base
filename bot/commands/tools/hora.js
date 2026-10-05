/** Hora actual en cualquier zona horaria (sin API externa: Intl de Node). */
import { UserError } from '../../lib/errors.js'

export default {
  name: 'hora',
  aliases: ['time', 'timezone'],
  category: 'tools',
  args: '[zona]',
  description: 'Ver la hora en una zona horaria',
  example: 'hora America/Mexico_City',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const zone = text.trim() || 'UTC'
    let formatter
    try {
      formatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: zone, dateStyle: 'full', timeStyle: 'long', hour12: false
      })
    } catch {
      throw new UserError(
        '🕒 Zona horaria no válida.\n\nEjemplos: *UTC*, *Europe/Madrid*, *America/Mexico_City*, *America/Argentina/Buenos_Aires*'
      )
    }
    await m.reply(`🕒 *Hora en ${zone}*\n\n${formatter.format(new Date())}`)
  }
}
