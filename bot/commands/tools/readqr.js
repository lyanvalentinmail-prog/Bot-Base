/** Lee un codigo QR de una imagen (API publica de goQR.me). */
import { apiPost } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'leerqr',
  aliases: ['readqr', 'scanqr'],
  category: 'tools',
  args: '',
  description: 'Leer el contenido de un código QR en una imagen',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    const buffer = await m.downloadAny()
    if (!buffer) throw new UserError('🖼️ Envía o responde a una imagen con un código QR.')

    const form = new FormData()
    form.append('file', new Blob([buffer]), 'qr.png')
    const data = await apiPost('https://api.qrserver.com/v1/read-qr-code/', form, {}, 'goQR.me')

    const content = data?.[0]?.symbol?.[0]?.data
    if (!content) throw new UserError('❌ No se detectó ningún código QR en la imagen.')
    await m.reply(`🔎 *Contenido del QR:*\n\n${content}`)
  }
}
