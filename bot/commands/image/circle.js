/** Recorta una imagen en forma de circulo (ideal para fotos de perfil). */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'circulo',
  aliases: ['circle', 'pfp'],
  category: 'image',
  args: '',
  description: 'Recortar una imagen en círculo',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')
    const image = await read(buffer)
    const size = Math.min(image.bitmap.width, image.bitmap.height)
    image.cover({ w: size, h: size })
    image.circle()
    await m.reply({ image: await toPng(image), caption: '▣ Recorte circular' })
  }
}
