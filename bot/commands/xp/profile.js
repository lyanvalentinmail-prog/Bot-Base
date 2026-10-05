/** Perfil del usuario: nivel, XP, economia y limites. */
import config, { isOwnerNumber } from '../../config.js'
import { getUser } from '../../database/index.js'
import { xpForLevel, rankOf } from '../../lib/levelling.js'
import { formatNumber, progressBar, formatDate } from '../../lib/functions.js'

export default {
  name: 'perfil',
  aliases: ['profile', 'me'],
  category: 'xp',
  args: '[@usuario]',
  description: 'Ver tu perfil completo',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ sock, m, user, isOwner }) {
    const targetJid = m.mentionedJid[0] || m.quoted?.sender
    const target = targetJid ? getUser(targetJid) : user
    const name = targetJid ? `@${targetJid.split('@')[0]}` : (user.name || m.pushName || 'Usuario')
    const needed = xpForLevel(target.level)

    const text =
      `╭──( *PERFIL* )\n` +
      `║🎌 Usuario ☇ *${name}*\n` +
      `│⛩️ Rango ☇ *${rankOf(target.level)}*\n` +
      `║🏮 Nivel ☇ *${target.level}*\n` +
      `│🍡 XP ☇ *${formatNumber(target.xp)}/${formatNumber(needed)}*\n` +
      `║🎴 ${progressBar(target.xp, needed)}\n` +
      `│🎐 Monedas ☇ *${formatNumber(target.money)}*\n` +
      `║🍙 Límite diario ☇ *${target.premium ? '∞ (premium)' : formatNumber(target.limit)}*\n` +
      `│🎋 Premium ☇ *${target.premium ? `sí (hasta ${formatDate(target.premiumUntil, false)})` : 'no'}*\n` +
      `║🗾 Rol ☇ *${(!targetJid && isOwner) || isOwnerNumber(target.id) ? 'Owner' : target.premium ? 'Premium' : 'Usuario'}*\n` +
      `│🎏 Mensajes ☇ *${formatNumber(target.messages || 0)}*\n` +
      `║🎑 Comandos ☇ *${formatNumber(target.commands || 0)}*\n` +
      `╰━━━━━━━━━━━━━━━━━━━⬣`

    const avatar = await sock.profilePictureUrl(targetJid || m.sender, 'image').catch(() => null)
    if (avatar) {
      const { fetchBuffer } = await import('../../lib/apiClient.js')
      const file = await fetchBuffer(avatar).catch(() => null)
      if (file?.buffer) {
        await m.reply({ image: file.buffer, caption: text, mentions: targetJid ? [targetJid] : [] })
        return
      }
    }
    await m.reply(text, targetJid ? { mentions: [targetJid] } : {})
  }
}
