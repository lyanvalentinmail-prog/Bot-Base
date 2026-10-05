/** Informacion del grupo actual. */
import { formatDate } from '../../lib/functions.js'
import { adminsOf } from '../../lib/group.js'

export default {
  name: 'infogrupo',
  aliases: ['groupinfo', 'gcinfo'],
  category: 'panel',
  args: '',
  description: 'Ver información del grupo',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  group: true,

  async exec ({ sock, m, metadata, group }) {
    if (!metadata) { await m.reply('❌ No pude obtener los datos del grupo.'); return }
    const admins = adminsOf(metadata)

    const text =
      `╭─❏ *${metadata.subject}*\n` +
      `│ 🆔 ${metadata.id}\n` +
      `│ 👥 Miembros ☇ ${metadata.participants.length}\n` +
      `│ 🛡️ Admins ☇ ${admins.length}\n` +
      `│ 📅 Creado ☇ ${formatDate(Number(metadata.creation) * 1000, false)}\n` +
      `│ 🔒 Solo admins ☇ ${metadata.announce ? 'sí' : 'no'}\n` +
      `│ 🔗 Antilink ☇ ${group.antilink ? 'activado' : 'desactivado'}\n` +
      `│ 👋 Bienvenidas ☇ ${group.welcome ? 'activadas' : 'desactivadas'}\n` +
      `│ 🔇 Silenciado ☇ ${group.mute ? 'sí' : 'no'}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      (metadata.desc ? `📝 *Descripción:*\n${String(metadata.desc).slice(0, 500)}` : '')

    const picture = await sock.profilePictureUrl(m.chat, 'image').catch(() => null)
    if (picture) {
      const { fetchBuffer } = await import('../../lib/apiClient.js')
      const file = await fetchBuffer(picture).catch(() => null)
      if (file?.buffer) { await m.reply({ image: file.buffer, caption: text }); return }
    }
    await m.reply(text)
  }
}
