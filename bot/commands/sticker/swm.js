/** Cambia el pack y el autor de un sticker existente. */
import config from '../../config.js'
import { addExif } from '../../lib/sticker.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'swm',
  aliases: ['stickerwm', 'take', 'tomar'],
  category: 'sticker',
  args: '<pack>|[autor]',
  description: 'Cambiar el pack/autor de un sticker',
  example: 'swm MiPack|MiNombre',
  mediaArg: true,
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    if (m.quoted?.type !== 'stickerMessage' && m.type !== 'stickerMessage') {
      throw new UserError('◩ Responde a un *sticker* indicando el nuevo pack.\nEjemplo: *.swm MiPack|MiNombre*')
    }

    const [pack, author] = text.split('|').map((part) => part?.trim())
    const buffer = await m.downloadAny()
    const sticker = await addExif(buffer, pack || config.botName, author || config.ownerName)
    await m.reply({ sticker })
  }
}
