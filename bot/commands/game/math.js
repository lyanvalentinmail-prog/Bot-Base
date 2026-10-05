/** Reto matematico con recompensa. */
import { randomInt } from '../../lib/functions.js'
import { setSession, hasSession } from '../../lib/games.js'
import { UserError } from '../../lib/errors.js'

const LEVELS = {
  facil: { range: [1, 20], ops: ['+', '-'], time: 40, money: 60, xp: 10 },
  medio: { range: [5, 60], ops: ['+', '-', '*'], time: 50, money: 140, xp: 25 },
  dificil: { range: [10, 120], ops: ['+', '-', '*'], time: 60, money: 300, xp: 50 }
}

export default {
  name: 'math',
  aliases: ['matematicas', 'calculo'],
  category: 'game',
  args: '[facil|medio|dificil]',
  description: 'Resolver un reto matemático por monedas',
  example: 'math medio',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m, args }) {
    if (hasSession(m.chat)) throw new UserError('🎮 Ya hay un juego activo en este chat.')

    const levelName = (args[0] || 'facil').toLowerCase()
    const level = LEVELS[levelName] || LEVELS.facil

    const a = randomInt(...level.range)
    const b = randomInt(...level.range)
    const op = level.ops[randomInt(0, level.ops.length - 1)]
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b

    setSession(m.chat, {
      type: 'math',
      answer,
      money: level.money,
      xp: level.xp,
      expiresAt: Date.now() + level.time * 1000
    })

    await m.reply(
      `♟ *RETO MATEMÁTICO* (${levelName})\n\n` +
      `🧮 ¿Cuánto es *${a} ${op === '*' ? '×' : op} ${b}*?\n\n` +
      `⏱️ Tiempo ☇ ${level.time}s\n💰 Premio ☇ ${level.money} monedas + ${level.xp} XP\n\n` +
      `_Responde con el número en este chat._`
    )
  }
}
