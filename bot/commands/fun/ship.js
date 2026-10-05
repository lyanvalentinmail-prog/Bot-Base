/** Calcula la compatibilidad entre dos personas (resultado estable por pareja). */
import { md5 } from '../../lib/functions.js'

export default {
  name: 'ship',
  aliases: ['compatibilidad', 'amor'],
  category: 'fun',
  args: '<@usuario1> <@usuario2>',
  description: 'Calcular la compatibilidad entre dos usuarios',
  example: 'ship @ana @luis',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  group: true,

  async exec ({ m, sock }) {
    let [a, b] = m.mentionedJid
    if (!a && m.quoted) a = m.quoted.sender
    if (!b) b = m.sender
    if (!a || !b || a === b) {
      await m.reply('💞 Menciona a *dos* personas distintas.\nEjemplo: *.ship @ana @luis*')
      return
    }

    const pair = [a, b].sort().join('')
    const percent = parseInt(md5(pair).slice(0, 4), 16) % 101
    const hearts = '❤️'.repeat(Math.max(1, Math.round(percent / 20)))
    const verdict = percent > 85 ? 'Almas gemelas 💍'
      : percent > 65 ? 'Hay mucha química 🔥'
      : percent > 40 ? 'Podría funcionar 🌱'
      : percent > 20 ? 'Mejor como amigos 🤝'
      : 'Ni lo intenten 💔'

    await sock.sendMessage(m.chat, {
      text: `💘 *SHIP*\n\n@${a.split('@')[0]}  ×  @${b.split('@')[0]}\n\n${hearts}\n*${percent}%* · ${verdict}`,
      mentions: [a, b]
    }, { quoted: m.raw })
  }
}
