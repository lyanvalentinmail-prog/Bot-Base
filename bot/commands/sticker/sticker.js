/** Convierte imagenes, vídeos cortos o gifs en stickers. */
import config from '../../config.js'
import { createSticker } from '../../lib/sticker.js'
import { ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'sticker',
  aliases: ['s', 'stiker', 'stickergif'],
  category: 'sticker',
  args: '[pack|autor]',
  description: 'Convertir imagen o vídeo en sticker',
  example: 's MiPack|MiNombre',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 5,

  async exec ({ m, text }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para crear stickers.\nTermux: `pkg install ffmpeg -y`')

    const mime = m.anyMime
    if (!mime || !/image|video|webp/.test(mime)) {
      throw new UserError('🖼️ Envía o responde a una *imagen*, *vídeo corto* o *gif* con el comando.')
    }
    if (/video/.test(mime)) {
      const seconds = m.isMedia ? m.msg?.seconds : m.quoted?.msg?.seconds
      if (seconds && seconds > 10) throw new UserError('⏱️ El vídeo no puede durar más de 10 segundos.')
    }

    await m.react('🪄')
    const buffer = await m.downloadAny()
    if (!buffer) throw new UserError('❌ No pude descargar el archivo.')

    const [pack, author] = text.split('|').map((part) => part?.trim())
    const sticker = await createSticker(buffer, {
      mime,
      ext: /video/.test(mime) ? 'mp4' : (/gif/.test(mime) ? 'gif' : 'jpg'),
      animated: /video|gif/.test(mime),
      forceConvert: true,
      packname: pack || config.botName,
      author: author || config.ownerName
    })

    await m.reply({ sticker })
    await m.react('✅')
  }
}
