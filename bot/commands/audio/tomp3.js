/** Extrae el audio de un vídeo o nota de voz y lo envia como MP3. */
import { toMp3, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'tomp3',
  aliases: ['toaudio', 'mp3'],
  category: 'audio',
  args: '',
  description: 'Convertir vídeo o nota de voz a MP3',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para convertir audio.')
    const mime = m.anyMime
    if (!/video|audio/.test(mime)) throw new UserError('♫ Responde a un *vídeo* o *audio*.')

    await m.react('🎧')
    const buffer = await m.downloadAny()
    const ext = /video/.test(mime) ? 'mp4' : 'ogg'
    const mp3 = await toMp3(buffer, ext)
    await m.reply({ audio: mp3, mimetype: 'audio/mpeg', fileName: `audio-${Date.now()}.mp3` })
  }
}
