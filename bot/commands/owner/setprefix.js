/** Cambia el prefijo de los comandos. */
import { setSetting } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'setprefix',
  aliases: ['prefijo'],
  category: 'owner',
  args: '<prefijo>',
  description: 'Cambiar el prefijo de los comandos',
  example: 'setprefix !',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, text }) {
    const prefix = text.trim()
    if (!prefix || prefix.length > 3 || /\s/.test(prefix)) {
      throw new UserError('⚙️ El prefijo debe tener entre 1 y 3 caracteres y sin espacios.')
    }
    setSetting('prefix', prefix)
    await m.reply(`✅ Prefijo cambiado a *${prefix}*\n\nPruébalo: *${prefix}menu*`)
  }
}
