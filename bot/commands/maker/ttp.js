/** Texto convertido en sticker (TTP). */
import config from '../../config.js'
import { textToImage } from '../../lib/image.js'
import { createSticker } from '../../lib/sticker.js'
import { ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ttp',
  aliases: ['textosticker'],
  category: 'maker',
  args: '<texto>',
  description: 'Convertir texto en sticker',
  example: 'ttp hola mundo',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 5,

  async exec ({ m, text }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para crear stickers.')
    const content = (text || m.quoted?.text || '').trim()
    if (!content) throw new UserError('✏️ Escribe el texto.\nEjemplo: *.ttp hola mundo*')
    if (content.length > 100) throw new UserError('✏️ Máximo 100 caracteres.')

    await m.react('🪄')
    const png = await textToImage(content, { canvas: 512 })
    const sticker = await createSticker(png, {
      mime: 'image/png', ext: 'png', animated: false, forceConvert: true,
      packname: config.botName, author: config.ownerName
    })
    await m.reply({ sticker })
  }
}
