/** Texto en sticker animado con colores que cambian (ATTP). */
import fsp from 'node:fs/promises'
import config from '../../config.js'
import { textToImage } from '../../lib/image.js'
import { addExif } from '../../lib/sticker.js'
import { ffmpegAvailable } from '../../lib/ffmpeg.js'
import { requireBinary, run } from '../../lib/binaries.js'
import { tempPath, cleanup } from '../../lib/tmp.js'
import { UserError } from '../../lib/errors.js'

const COLORS = [0xff4b4b, 0xffa14b, 0xffe94b, 0x4bff6e, 0x4bd2ff, 0x8a4bff, 0xff4bd2]

export default {
  name: 'attp',
  aliases: ['textoanimado'],
  category: 'maker',
  args: '<texto>',
  description: 'Convertir texto en sticker animado',
  example: 'attp hola',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m, text }) {
    if (!ffmpegAvailable()) throw new UserError('🎞️ Necesito *ffmpeg* para crear stickers animados.')
    const content = (text || m.quoted?.text || '').trim()
    if (!content) throw new UserError('✏️ Escribe el texto.\nEjemplo: *.attp hola*')
    if (content.length > 50) throw new UserError('✏️ Máximo 50 caracteres para el sticker animado.')

    await m.react('🪄')
    requireBinary('ffmpeg')

    const frames = []
    const numbered = []
    const output = tempPath('webp')
    try {
      for (let i = 0; i < COLORS.length; i++) {
        const png = await textToImage(content, { canvas: 512, tint: COLORS[i] })
        const file = tempPath('png')
        await fsp.writeFile(file, png)
        frames.push(file)
      }

      // Secuencia numerada para ffmpeg
      const pattern = tempPath('').replace(/\.$/, '')
      for (let i = 0; i < frames.length; i++) {
        const target = `${pattern}-${String(i).padStart(3, '0')}.png`
        await fsp.copyFile(frames[i], target)
        numbered.push(target)
      }

      await run('ffmpeg', [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', '5', '-i', `${pattern}-%03d.png`,
        '-vcodec', 'libwebp', '-lossless', '0', '-q:v', '70',
        '-loop', '0', '-preset', 'default', '-an', '-vsync', '0',
        output
      ])

      const webp = await fsp.readFile(output)
      const sticker = await addExif(webp, config.botName, config.ownerName)
      await m.reply({ sticker })
    } finally {
      await cleanup(frames, numbered, output)
    }
  }
}
