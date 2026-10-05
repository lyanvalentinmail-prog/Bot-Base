/** Pixela una imagen (censura rapida). */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'pixelar',
  aliases: ['pixelate', 'censurar'],
  category: 'image',
  args: '[tamaño]',
  description: 'Pixelar una imagen',
  example: 'pixelar 20',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')
    const size = Math.min(60, Math.max(2, parseInt(args[0], 10) || 12))
    const image = await read(buffer)
    image.pixelate(size)
    await m.reply({ image: await toPng(image), caption: `▣ Pixelado (${size})` })
  }
}
