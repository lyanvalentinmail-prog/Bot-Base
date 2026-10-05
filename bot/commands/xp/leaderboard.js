/** Clasificacion global por nivel, XP o dinero. */
import { getAllUsers } from '../../database/index.js'
import { formatNumber } from '../../lib/functions.js'
import { totalXpForLevel } from '../../lib/levelling.js'

const MEDALS = ['🥇', '🥈', '🥉']

export default {
  name: 'leaderboard',
  aliases: ['lb', 'top', 'ranking'],
  category: 'xp',
  args: '[xp|dinero]',
  description: 'Ver la clasificación global',
  example: 'leaderboard dinero',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args, sock }) {
    const mode = (args[0] || 'xp').toLowerCase()
    const byMoney = ['dinero', 'money', 'monedas'].includes(mode)

    const users = getAllUsers()
      .filter((u) => (byMoney ? u.money > 0 : u.xp > 0 || u.level > 1))
      .sort((a, b) => byMoney
        ? b.money - a.money
        : (totalXpForLevel(b.level) + b.xp) - (totalXpForLevel(a.level) + a.xp))
      .slice(0, 10)

    if (!users.length) { await m.reply('📊 Todavía no hay datos suficientes.'); return }

    const mentions = []
    const lines = users.map((user, index) => {
      const jid = user.id.includes('@') ? user.id : `${user.id}@s.whatsapp.net`
      mentions.push(jid)
      const medal = MEDALS[index] || `${index + 1}.`
      const value = byMoney
        ? `${formatNumber(user.money)} 💰`
        : `nivel ${user.level} · ${formatNumber(totalXpForLevel(user.level) + user.xp)} XP`
      return `${medal} @${jid.split('@')[0]} ☇ ${value}`
    })

    await sock.sendMessage(m.chat, {
      text: `★ *TOP 10 · ${byMoney ? 'MONEDAS' : 'EXPERIENCIA'}*\n\n${lines.join('\n')}`,
      mentions
    }, { quoted: m.raw })
  }
}
