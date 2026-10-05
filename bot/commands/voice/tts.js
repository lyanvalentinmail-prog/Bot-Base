/** Texto a voz con la API de audio de OpenAI (requiere OPENAI_API_KEY). */
import { openai } from '../../lib/apiClient.js'
import { toPtt, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

const VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer']

export default {
  name: 'tts',
  aliases: ['decir', 'voz'],
  category: 'voice',
  args: '<texto> [|voz]',
  description: 'Convertir texto en voz',
  example: 'tts Hola, soy un bot|nova',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m, text }) {
    const [raw, voiceName] = text.split('|').map((part) => part?.trim())
    const content = raw || m.quoted?.text
    if (!content) throw new UserError(`🗣️ Escribe el texto.\n\nVoces: ${VOICES.join(', ')}`)
    if (content.length > 1000) throw new UserError('🗣️ Máximo 1000 caracteres.')

    const voice = VOICES.includes((voiceName || '').toLowerCase()) ? voiceName.toLowerCase() : 'alloy'

    await m.react('🗣️')
    const mp3 = await openai.speech(content, { voice })

    if (ffmpegAvailable()) {
      const ptt = await toPtt(mp3, 'mp3')
      await m.reply({ audio: ptt, mimetype: 'audio/ogg; codecs=opus', ptt: true })
    } else {
      await m.reply({ audio: mp3, mimetype: 'audio/mpeg', fileName: 'tts.mp3' })
    }
  }
}
