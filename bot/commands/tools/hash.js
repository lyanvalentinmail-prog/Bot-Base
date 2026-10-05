/** Calcula hashes criptograficos de un texto. */
import crypto from 'node:crypto'
import { UserError } from '../../lib/errors.js'

const ALGOS = ['md5', 'sha1', 'sha256', 'sha512']

export default {
  name: 'hash',
  aliases: ['hashear'],
  category: 'tools',
  args: '<algoritmo> <texto>',
  description: 'Calcular hash (md5, sha1, sha256, sha512)',
  example: 'hash sha256 hola',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const algo = (args[0] || '').toLowerCase()
    const content = args.slice(1).join(' ') || m.quoted?.text || ''
    if (!ALGOS.includes(algo) || !content) {
      throw new UserError(`🔑 Uso: *.hash <${ALGOS.join('|')}> <texto>*`)
    }
    const digest = crypto.createHash(algo).update(content, 'utf8').digest('hex')
    await m.reply(`🔑 *${algo.toUpperCase()}*\n\n\`\`\`${digest}\`\`\``)
  }
}
