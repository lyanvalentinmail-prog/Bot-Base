/** Nivel y progreso de XP. */
import { xpForLevel, rankOf } from '../../lib/levelling.js'
import { formatNumber, progressBar } from '../../lib/functions.js'

export default {
  name: 'nivel',
  aliases: ['level', 'rank', 'xp'],
  category: 'xp',
  args: '',
  description: 'Ver tu nivel y progreso de XP',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const needed = xpForLevel(user.level)
    await m.reply(
      `★ *NIVEL ${user.level}* · ${rankOf(user.level)}\n\n` +
      `${progressBar(user.xp, needed, 16)}\n` +
      `XP ☇ *${formatNumber(user.xp)}/${formatNumber(needed)}*\n` +
      `Faltan ☇ *${formatNumber(Math.max(0, needed - user.xp))}* XP\n\n` +
      `_Ganas XP con cada mensaje y jugando._`
    )
  }
}
