/**
 * Sesiones de juego por chat (math, trivia, tres en raya).
 * El handler consulta handleGameMessage() antes de buscar comandos, de modo
 * que las respuestas de los jugadores no necesitan prefijo.
 */
import { addMoney, db } from '../database/index.js'
import { addXp } from './levelling.js'

/** @type {Map<string, object>} */
const sessions = new Map()

export const getSession = (chatId) => {
  const session = sessions.get(chatId)
  if (!session) return null
  if (session.expiresAt && session.expiresAt < Date.now()) { sessions.delete(chatId); return null }
  return session
}

export const setSession = (chatId, data) => sessions.set(chatId, data)
export const endSession = (chatId) => sessions.delete(chatId)
export const hasSession = (chatId) => Boolean(getSession(chatId))

/** Entrega recompensas y persiste los cambios. */
export function reward (user, money, xp) {
  addMoney(user, money)
  const result = addXp(user, xp)
  db.data.users[user.id].xp = user.xp
  db.data.users[user.id].level = user.level
  db.markDirty()
  return result
}

/* ─────────────── Tres en raya ─────────────── */

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

export function renderBoard (board) {
  const icons = { X: '❌', O: '⭕' }
  const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
  const cells = board.map((cell, index) => icons[cell] || numbers[index])
  return `${cells.slice(0, 3).join('')}\n${cells.slice(3, 6).join('')}\n${cells.slice(6, 9).join('')}`
}

export function winnerOf (board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return board.every(Boolean) ? 'draw' : null
}

/* ─────────────── Enrutador de mensajes de juego ─────────────── */

/**
 * @param {object} ctx contexto del handler
 * @returns {Promise<boolean>} true si el mensaje fue consumido por un juego
 */
export async function handleGameMessage (ctx) {
  const { m, user } = ctx
  const session = getSession(m.chat)
  if (!session) return false

  const body = (m.body || '').trim()
  if (!body) return false

  /* ─── Math ─── */
  if (session.type === 'math') {
    if (!/^-?\d+$/.test(body)) return false
    if (Number(body) !== session.answer) {
      await m.reply('❌ Respuesta incorrecta, sigue intentando.')
      return true
    }
    endSession(m.chat)
    reward(user, session.money, session.xp)
    await m.reply(
      `✅ ¡Correcto, *${user.name || m.pushName}*!\n\n` +
      `💰 +${session.money} monedas\n★ +${session.xp} XP`
    )
    return true
  }

  /* ─── Trivia ─── */
  if (session.type === 'trivia') {
    const letter = body.toUpperCase()
    if (!/^[A-D]$/.test(letter)) return false
    endSession(m.chat)
    if (letter === session.answer) {
      reward(user, session.money, session.xp)
      await m.reply(`✅ ¡Correcto! La respuesta era *${session.answer}) ${session.answerText}*\n\n💰 +${session.money} monedas\n★ +${session.xp} XP`)
    } else {
      await m.reply(`❌ Fallaste. La respuesta correcta era *${session.answer}) ${session.answerText}*`)
    }
    return true
  }

  /* ─── Tres en raya ─── */
  if (session.type === 'ttt') {
    const lower = body.toLowerCase()
    if (['rendirse', 'surrender', 'salir'].includes(lower)) {
      if (!session.players.includes(m.sender)) return false
      endSession(m.chat)
      const other = session.players.find((p) => p !== m.sender)
      await ctx.sock.sendMessage(m.chat, {
        text: `🏳️ @${m.senderNumber} se rindió. Gana @${other.split('@')[0]}.`,
        mentions: session.players
      })
      return true
    }

    if (!/^[1-9]$/.test(body)) return false
    const turnJid = session.players[session.turn]
    if (m.sender !== turnJid) return false

    const index = Number(body) - 1
    if (session.board[index]) {
      await m.reply('⚠️ Esa casilla ya está ocupada.')
      return true
    }

    session.board[index] = session.turn === 0 ? 'X' : 'O'
    const result = winnerOf(session.board)

    if (result === 'draw') {
      endSession(m.chat)
      await ctx.sock.sendMessage(m.chat, { text: `${renderBoard(session.board)}\n\n🤝 ¡Empate!` })
      return true
    }

    if (result) {
      endSession(m.chat)
      reward(user, 150, 30)
      await ctx.sock.sendMessage(m.chat, {
        text: `${renderBoard(session.board)}\n\n🏆 ¡Gana @${m.senderNumber}!\n💰 +150 monedas · ★ +30 XP`,
        mentions: [m.sender]
      })
      return true
    }

    session.turn = session.turn === 0 ? 1 : 0
    session.expiresAt = Date.now() + 5 * 60 * 1000
    const next = session.players[session.turn]
    await ctx.sock.sendMessage(m.chat, {
      text: `${renderBoard(session.board)}\n\n${session.turn === 0 ? '❌' : '⭕'} Turno de @${next.split('@')[0]}\n_Escribe un número del 1 al 9 · "rendirse" para abandonar_`,
      mentions: [next]
    })
    return true
  }

  return false
}

export default { getSession, setSession, endSession, hasSession, handleGameMessage, renderBoard, winnerOf, reward }
