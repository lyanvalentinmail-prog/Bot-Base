/** Convierte un sticker animado en vídeo MP4. */
import { webpToVideo, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'tovid',
  aliases: ['tovideo', 'tomp4'],
  category: 'sticker',
  args: '',
  description: 'Convertir un sticker animado en vídeo',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para esta conversión.')
    if (m.quoted?.type !== 'stickerMessage' && m.type !== 'stickerMessage') {
      throw new UserError('◩ Responde a un *sticker animado* con este comando.')
    }

    await m.react('🪄')
    const buffer = await m.downloadAny()
    const video = await webpToVideo(buffer)
    await m.reply({ video, mimetype: 'video/mp4', caption: '🎬 Sticker convertido a vídeo.' })
  }
}
