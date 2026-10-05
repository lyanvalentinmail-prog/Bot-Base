/** Convierte cualquier audio en nota de voz (PTT). */
import { toPtt, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'tovn',
  aliases: ['toptt', 'notadevoz'],
  category: 'audio',
  args: '',
  description: 'Convertir un audio en nota de voz',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para convertir audio.')
    const mime = m.anyMime
    if (!/audio|video/.test(mime)) throw new UserError('♫ Responde a un *audio* o *vídeo*.')

    await m.react('🎙️')
    const buffer = await m.downloadAny()
    const ptt = await toPtt(buffer, /video/.test(mime) ? 'mp4' : 'mp3')
    await m.reply({ audio: ptt, mimetype: 'audio/ogg; codecs=opus', ptt: true })
  }
}
