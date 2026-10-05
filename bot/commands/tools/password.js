/** Generador de contraseñas seguras. */
import crypto from 'node:crypto'

export default {
  name: 'password',
  aliases: ['pass', 'contraseña'],
  category: 'tools',
  args: '[longitud]',
  description: 'Generar una contraseña segura',
  example: 'password 20',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const length = Math.min(64, Math.max(8, parseInt(args[0], 10) || 16))
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?-_'
    const bytes = crypto.randomBytes(length)
    let password = ''
    for (let i = 0; i < length; i++) password += alphabet[bytes[i] % alphabet.length]
    await m.reply(`🔐 *Contraseña generada* (${length} caracteres)\n\n\`\`\`${password}\`\`\`\n\n_Guárdala en un gestor de contraseñas._`)
  }
}
