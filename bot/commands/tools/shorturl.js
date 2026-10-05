/** Acorta enlaces con is.gd (https://is.gd/apishorteningreference.php). */
import { apiGet } from '../../lib/apiClient.js'
import { isUrl } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'acortar',
  aliases: ['shorturl', 'short'],
  category: 'tools',
  args: '<url>',
  description: 'Acortar un enlace largo',
  example: 'acortar https://ejemplo.com/una/ruta/muy/larga',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const url = text.trim()
    if (!isUrl(url)) throw new UserError('🔗 Envía una URL válida que empiece por http:// o https://')

    const data = await apiGet('https://is.gd/create.php', {
      params: { format: 'json', url }
    }, 'is.gd')

    if (data?.errormessage) throw new UserError(`❌ ${data.errormessage}`)
    await m.reply(`🔗 *Enlace acortado*\n\n📥 Original: ${url}\n📤 Corto: ${data.shorturl}`)
  }
}
