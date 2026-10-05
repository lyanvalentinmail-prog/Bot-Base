/** Fabrica de comandos de efectos de voz: todos comparten la misma logica. */
import { applyAudioFilter, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

export function makeVoiceEffect ({ name, aliases, filter, description, emoji = '♬' }) {
  return {
    name,
    aliases,
    category: 'voice',
    args: '',
    description,
    mediaArg: true,
    limit: true,
    premium: false,
    owner: false,
    admin: false,
    cooldown: 8,

    async exec ({ m }) {
      if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para aplicar efectos de voz.')
      const mime = m.anyMime
      if (!/audio|video/.test(mime)) throw new UserError(`${emoji} Responde a un *audio* o *nota de voz* con este comando.`)

      await m.react(emoji)
      const buffer = await m.downloadAny()
      const result = await applyAudioFilter(buffer, filter, /video/.test(mime) ? 'mp4' : 'mp3')
      await m.reply({ audio: result, mimetype: 'audio/mpeg', fileName: `${name}-${Date.now()}.mp3` })
    }
  }
}
