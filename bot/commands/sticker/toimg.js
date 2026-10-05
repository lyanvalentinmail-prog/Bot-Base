/** Convierte un sticker estatico en imagen PNG. */
import { webpToImage, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'toimg',
  aliases: ['toimagen', 'tophoto'],
  category: 'sticker',
  args: '',
  description: 'Convertir un sticker en imagen',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para esta conversión.')
    if (m.quoted?.type !== 'stickerMessage' && m.type !== 'stickerMessage') {
      throw new UserError('◩ Responde a un *sticker* con este comando.')
    }

    await m.react('🪄')
    const buffer = await m.downloadAny()
    const image = await webpToImage(buffer)
    await m.reply({ image, caption: '🖼️ Sticker convertido a imagen.' })
  }
}
