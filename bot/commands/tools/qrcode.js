/** Genera un codigo QR (API publica de goQR.me). */
import { fetchBuffer } from '../../lib/apiClient.js'

export default {
  name: 'qr',
  aliases: ['qrcode', 'codigoqr'],
  category: 'tools',
  args: '<texto>',
  description: 'Generar un código QR',
  example: 'qr https://ejemplo.com',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const content = text || m.quoted?.text
    if (!content) { await m.reply('✏️ Escribe el texto o enlace del QR.'); return }

    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(content)}`
    const { buffer } = await fetchBuffer(url, {}, 'goQR.me')
    await m.reply({ image: buffer, caption: `🔳 *Código QR generado*\n\n${content.slice(0, 200)}` })
  }
}
