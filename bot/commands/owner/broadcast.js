/** Envia un mensaje a todos los chats conocidos. */
import { db } from '../../database/index.js'
import { sleep } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'broadcast',
  aliases: ['bc', 'difusion'],
  category: 'owner',
  args: '<mensaje>',
  description: 'Enviar un mensaje a todos los grupos',
  example: 'broadcast Mantenimiento a las 22:00',
  limit: false,
  premium: false,
  owner: true,
  admin: false,
  cooldown: 60,

  async exec ({ sock, m, text }) {
    const message = text || m.quoted?.text
    if (!message) throw new UserError('📢 Escribe el mensaje a difundir.')

    const groups = Object.keys(db.groups)
    if (!groups.length) throw new UserError('📢 El bot todavía no conoce ningún grupo.')

    await m.reply(`📢 Enviando a ${groups.length} grupo(s)...`)

    let sent = 0
    let failed = 0
    for (const jid of groups) {
      try {
        await sock.sendMessage(jid, { text: `📢 *MENSAJE DEL PROPIETARIO*\n\n${message}` })
        sent++
        await sleep(1500) // evita el rate limit de WhatsApp
      } catch {
        failed++
      }
    }

    await m.reply(`✅ Difusión terminada.\n\n📬 Enviados ☇ ${sent}\n❌ Fallidos ☇ ${failed}`)
  }
}
