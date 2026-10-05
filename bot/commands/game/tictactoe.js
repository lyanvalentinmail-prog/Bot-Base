/** Tres en raya entre dos jugadores del grupo. */
import { setSession, hasSession, renderBoard } from '../../lib/games.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ttt',
  aliases: ['tictactoe', 'tresenraya'],
  category: 'game',
  args: '<@usuario>',
  description: 'Jugar tres en raya con alguien',
  example: 'ttt @amigo',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  group: true,

  async exec ({ sock, m }) {
    if (hasSession(m.chat)) throw new UserError('🎮 Ya hay un juego activo en este chat.')

    const opponent = m.mentionedJid[0] || m.quoted?.sender
    if (!opponent) throw new UserError('♟ Menciona a tu rival.\nEjemplo: *.ttt @amigo*')
    if (opponent === m.sender) throw new UserError('♟ No puedes jugar contra ti mismo.')

    const board = Array(9).fill(null)
    setSession(m.chat, {
      type: 'ttt',
      board,
      players: [m.sender, opponent],
      turn: 0,
      expiresAt: Date.now() + 5 * 60 * 1000
    })

    await sock.sendMessage(m.chat, {
      text:
        `♟ *TRES EN RAYA*\n\n` +
        `❌ @${m.senderNumber}\n⭕ @${opponent.split('@')[0]}\n\n` +
        `${renderBoard(board)}\n\n` +
        `❌ Empieza @${m.senderNumber}\n_Escribe un número del 1 al 9 · "rendirse" para abandonar_`,
      mentions: [m.sender, opponent]
    }, { quoted: m.raw })
  }
}
