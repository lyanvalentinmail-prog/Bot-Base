/** Puntua cualquier cosa del 0 al 100 (resultado estable). */
import { md5 } from '../../lib/functions.js'

export default {
  name: 'rate',
  aliases: ['puntuar', 'calificar'],
  category: 'fun',
  args: '<cosa>',
  description: 'Puntuar algo del 0 al 100',
  example: 'rate mi nuevo corte de pelo',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const score = parseInt(md5(text.toLowerCase().trim()).slice(0, 4), 16) % 101
    const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10))
    await m.reply(`⭐ *${text}*\n\n${bar} *${score}/100*`)
  }
}
