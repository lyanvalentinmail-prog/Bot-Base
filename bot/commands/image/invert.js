/** Invierte los colores de una imagen. */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'invertir',
  aliases: ['invert', 'negativo'],
  category: 'image',
  args: '',
  description: 'Invertir los colores de una imagen',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')
    const image = await read(buffer)
    image.invert()
    await m.reply({ image: await toPng(image), caption: '▣ Colores invertidos' })
  }
}
