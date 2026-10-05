/** Voltea una imagen en horizontal o vertical. */
import { read, toPng } from '../../lib/image.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'flip',
  aliases: ['voltear', 'espejo'],
  category: 'image',
  args: '[h|v]',
  description: 'Voltear una imagen (horizontal o vertical)',
  example: 'flip v',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')
    const vertical = (args[0] || 'h').toLowerCase().startsWith('v')
    const image = await read(buffer)
    image.flip({ horizontal: !vertical, vertical })
    await m.reply({ image: await toPng(image), caption: `▣ Volteada en ${vertical ? 'vertical' : 'horizontal'}` })
  }
}
