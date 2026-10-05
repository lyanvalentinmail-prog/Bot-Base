/** Perfil publico de Minecraft Java (API de Mojang). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'mcstalk',
  aliases: ['minecraft', 'mcuser'],
  category: 'stalk',
  args: '<usuario>',
  description: 'Consultar el UUID de una cuenta de Minecraft',
  example: 'mcstalk Notch',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const username = text.trim()
    if (!/^\w{3,16}$/.test(username)) throw new UserError('❌ Nombre de Minecraft no válido (3-16 caracteres).')

    let data
    try {
      data = await apiGet(`https://api.mojang.com/users/profiles/minecraft/${username}`, {}, 'Mojang')
    } catch {
      throw new UserError(`❌ La cuenta *${username}* no existe.`)
    }
    if (!data?.id) throw new UserError(`❌ La cuenta *${username}* no existe.`)

    const uuid = data.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
    await m.reply(
      `╭─❏ *MINECRAFT · ${data.name}*\n` +
      `│ 🆔 UUID ☇ ${uuid}\n` +
      `│ 🔑 UUID corto ☇ ${data.id}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n_Datos públicos de la API de Mojang_`
    )
  }
}
