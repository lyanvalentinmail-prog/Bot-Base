/** Quita el fondo de una imagen con remove.bg (requiere REMOVE_BG_API_KEY). */
import { removebg } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'removebg',
  aliases: ['quitarfondo', 'nobg'],
  category: 'image',
  args: '',
  description: 'Quitar el fondo de una imagen',
  mediaArg: true,
  limit: true,
  premium: true,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m }) {
    const buffer = await m.downloadAny()
    if (!buffer || !/image/.test(m.anyMime)) throw new UserError('🖼️ Envía o responde a una *imagen*.')

    await m.react('✂️')
    const result = await removebg.remove(buffer)
    await m.reply({ image: result, caption: '▣ Fondo eliminado · _remove.bg_' })
  }
}
