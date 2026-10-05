/** Descarga un archivo desde una URL publica y lo reenvia por WhatsApp. */
import { fetchBuffer } from '../../lib/apiClient.js'
import { isUrl, formatBytes } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

const MAX_BYTES = 45 * 1024 * 1024

export default {
  name: 'getfile',
  aliases: ['descargar', 'dl'],
  category: 'downloader',
  args: '<url>',
  description: 'Descargar un archivo de un enlace público',
  example: 'getfile https://ejemplo.com/archivo.pdf',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m, text }) {
    const url = text.trim().split(/\s+/)[0]
    if (!isUrl(url)) throw new UserError('🔗 Envía una URL pública válida (http/https).')

    await m.react('⏬')
    const { buffer, contentType } = await fetchBuffer(url, { maxContentLength: MAX_BYTES, maxBodyLength: MAX_BYTES })
    if (buffer.length > MAX_BYTES) throw new UserError(`📦 El archivo pesa ${formatBytes(buffer.length)} y el límite es ${formatBytes(MAX_BYTES)}.`)

    const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'archivo')
    const caption = `📥 *${name}*\n📦 ${formatBytes(buffer.length)}\n🏷️ ${contentType || 'desconocido'}`

    if (/^image\//.test(contentType)) await m.reply({ image: buffer, caption })
    else if (/^video\//.test(contentType)) await m.reply({ video: buffer, caption })
    else if (/^audio\//.test(contentType)) await m.reply({ audio: buffer, mimetype: contentType, fileName: name })
    else await m.reply({ document: buffer, mimetype: contentType || 'application/octet-stream', fileName: name, caption })

    await m.react('✅')
  }
}
