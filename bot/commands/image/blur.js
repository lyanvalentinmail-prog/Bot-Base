/** Desenfoca una imagen. */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'blur',
  aliases: ['desenfocar'],
  category: 'image',
  args: '[intensidad]',
  description: 'Desenfocar una imagen',
  example: 'blur 10',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')
    const radius = Math.min(50, Math.max(1, parseInt(args[0], 10) || 8))
    const image = await read(buffer)
    image.blur(radius)
    await m.reply({ image: await toPng(image), caption: `▣ Desenfoque aplicado (${radius})` })
  }
}
