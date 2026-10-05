/** Codifica y decodifica texto en Base64. */
import { UserError } from '../../lib/errors.js'

export default {
  name: 'base64',
  aliases: ['b64'],
  category: 'tools',
  args: '<encode|decode> <texto>',
  description: 'Codificar o decodificar Base64',
  example: 'base64 encode hola mundo',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const mode = (args[0] || '').toLowerCase()
    const content = args.slice(1).join(' ') || m.quoted?.text || ''
    if (!['encode', 'decode', 'e', 'd'].includes(mode) || !content) {
      throw new UserError('✏️ Uso: *.base64 encode <texto>* o *.base64 decode <texto>*')
    }
    if (mode.startsWith('e')) {
      await m.reply(`🔐 *Base64 (codificado)*\n\n${Buffer.from(content, 'utf8').toString('base64')}`)
    } else {
      const decoded = Buffer.from(content, 'base64').toString('utf8')
      if (!decoded) throw new UserError('❌ Ese texto no es Base64 válido.')
      await m.reply(`🔓 *Base64 (decodificado)*\n\n${decoded}`)
    }
  }
}
