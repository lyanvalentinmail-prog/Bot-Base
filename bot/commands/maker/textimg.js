/** Genera una imagen con el texto indicado sobre un fondo de color. */
import { Jimp, getFont } from '../../lib/image.js'
import { HorizontalAlign, VerticalAlign, measureTextHeight } from 'jimp'
import { UserError } from '../../lib/errors.js'

const BACKGROUNDS = {
  negro: 0x111111ff, blanco: 0xf5f5f5ff, azul: 0x1d4ed8ff, rojo: 0xb91c1cff,
  verde: 0x15803dff, morado: 0x6d28d9ff, rosa: 0xdb2777ff, naranja: 0xea580cff
}

export default {
  name: 'textimg',
  aliases: ['textoimagen', 'quoteimg'],
  category: 'maker',
  args: '<texto> [|color]',
  description: 'Crear una imagen con texto',
  example: 'textimg Hola mundo|azul',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const [raw, colorName] = text.split('|').map((part) => part?.trim())
    const content = raw || m.quoted?.text
    if (!content) throw new UserError(`✏️ Escribe el texto.\n\nColores: ${Object.keys(BACKGROUNDS).join(', ')}`)
    if (content.length > 300) throw new UserError('✏️ Máximo 300 caracteres.')

    const background = BACKGROUNDS[(colorName || 'negro').toLowerCase()] ?? BACKGROUNDS.negro
    const width = 800
    const image = new Jimp({ width, height: 450, color: background })

    const isLight = (colorName || '').toLowerCase() === 'blanco'
    const { font } = await getFont(content.length > 80 ? 32 : 64, isLight ? 'black' : 'white')
    const height = measureTextHeight(font, content, width - 80)

    if (height > 370) {
      const small = await getFont(32, isLight ? 'black' : 'white')
      image.print({
        font: small.font, x: 40, y: 40,
        text: { text: content, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE },
        maxWidth: width - 80, maxHeight: 370
      })
    } else {
      image.print({
        font, x: 40, y: 40,
        text: { text: content, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE },
        maxWidth: width - 80, maxHeight: 370
      })
    }

    await m.reply({ image: await image.getBuffer('image/png'), caption: '✎ Imagen generada' })
  }
}
