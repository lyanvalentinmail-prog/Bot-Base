/** Convierte una imagen a blanco y negro. */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'bw',
  aliases: ['grayscale', 'blancoynegro'],
  category: 'image',
  args: '',
  description: 'Imagen en blanco y negro',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')
    const image = await read(buffer)
    image.greyscale()
    await m.reply({ image: await toPng(image), caption: '▣ Blanco y negro' })
  }
}
