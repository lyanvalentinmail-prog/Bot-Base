/** Menciona a todos los miembros del grupo. */
import { UserError } from '../../lib/errors.js'

export default {
  name: 'tagall',
  aliases: ['todos', 'everyone'],
  category: 'panel',
  args: '[mensaje]',
  description: 'Mencionar a todos los miembros',
  example: 'tagall reunión a las 8',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  group: true,
  cooldown: 30,

  async exec ({ sock, m, text, metadata }) {
    const participants = metadata?.participants || []
    if (!participants.length) throw new UserError('❌ No pude obtener la lista de miembros.')

    const mentions = participants.map((p) => p.id)
    const list = mentions.map((jid) => `│ ✿ @${jid.split('@')[0]}`).join('\n')

    await sock.sendMessage(m.chat, {
      text: `╭─❏ *ATENCIÓN* (${mentions.length})\n${text ? `│ 📢 ${text}\n├────────────\n` : ''}${list}\n╰━━━━━━━━━━━━━━━⬣`,
      mentions
    }, { quoted: m.raw })
  }
}
