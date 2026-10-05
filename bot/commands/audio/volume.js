/** Sube o baja el volumen de un audio. */
import { changeVolume, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'volumen',
  aliases: ['volume', 'vol'],
  category: 'audio',
  args: '<factor>',
  description: 'Cambiar el volumen de un audio (0.1 - 5)',
  example: 'volumen 1.5',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, args }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para procesar audio.')
    if (!/audio|video/.test(m.anyMime)) throw new UserError('♫ Responde a un *audio*.')

    const factor = Number(String(args[0]).replace(',', '.'))
    if (!Number.isFinite(factor) || factor < 0.1 || factor > 5) {
      throw new UserError('🔊 Indica un factor entre 0.1 y 5.\nEjemplo: *.volumen 1.5*')
    }

    await m.react('🔊')
    const buffer = await m.downloadAny()
    const result = await changeVolume(buffer, factor, /video/.test(m.anyMime) ? 'mp4' : 'mp3')
    await m.reply({ audio: result, mimetype: 'audio/mpeg', fileName: `volumen-${factor}.mp3` })
  }
}
