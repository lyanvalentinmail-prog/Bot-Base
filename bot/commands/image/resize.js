/** Redimensiona una imagen. */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'resize',
  aliases: ['redimensionar', 'escalar'],
  category: 'image',
  args: '<ancho> [alto]',
  description: 'Redimensionar una imagen',
  example: 'resize 720 480',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen* indicando el tamaño.')

    const width = Math.min(4096, Math.max(16, parseInt(args[0], 10) || 0))
    if (!width) throw new UserError('📐 Indica el ancho.\nEjemplo: *.resize 720* o *.resize 720 480*')
    const height = Math.min(4096, Math.max(16, parseInt(args[1], 10) || 0))

    const image = await read(buffer)
    image.resize(height ? { w: width, h: height } : { w: width })
    await m.reply({
      image: await toPng(image),
      caption: `▣ Redimensionada a ${image.bitmap.width}×${image.bitmap.height}`
    })
  }
}
