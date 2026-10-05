/** Recorta un fragmento de un audio. */
import { convert, ffmpegAvailable } from '../../lib/ffmpeg.js'
import { UserError } from '../../lib/errors.js'

/** Acepta "90" o "1:30" y devuelve segundos. */
function parseTime (value) {
  if (!value) return null
  if (/^\d+$/.test(value)) return Number(value)
  const parts = value.split(':').map(Number)
  if (parts.some((n) => !Number.isFinite(n))) return null
  return parts.reduce((total, part) => total * 60 + part, 0)
}

export default {
  name: 'cortar',
  aliases: ['cut', 'trim'],
  category: 'audio',
  args: '<inicio> <duración>',
  description: 'Recortar un audio (segundos o mm:ss)',
  example: 'cortar 0:30 15',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, args }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para recortar audio.')
    const mime = m.anyMime
    if (!/audio|video/.test(mime)) throw new UserError('♫ Responde a un *audio* indicando inicio y duración.')

    const start = parseTime(args[0])
    const duration = parseTime(args[1])
    if (start === null || duration === null || duration <= 0) {
      throw new UserError('✂️ Uso: *.cortar <inicio> <duración>*\nEjemplo: *.cortar 0:30 15*')
    }
    if (duration > 600) throw new UserError('✂️ Máximo 10 minutos por recorte.')

    await m.react('✂️')
    const buffer = await m.downloadAny()
    const result = await convert(buffer, /video/.test(mime) ? 'mp4' : 'mp3', 'mp3', [
      '-ss', String(start), '-t', String(duration), '-vn', '-b:a', '128k'
    ])
    await m.reply({ audio: result, mimetype: 'audio/mpeg', fileName: `recorte-${Date.now()}.mp3` })
  }
}
