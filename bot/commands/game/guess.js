/** Adivina el numero secreto (juego individual por mensaje). */
import { randomInt } from '../../lib/functions.js'
import { setSession, hasSession } from '../../lib/games.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'adivina',
  aliases: ['guess', 'numero'],
  category: 'game',
  args: '[máximo]',
  description: 'Adivinar un número secreto',
  example: 'adivina 50',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m, args }) {
    if (hasSession(m.chat)) throw new UserError('🎮 Ya hay un juego activo en este chat.')

    const max = Math.min(1000, Math.max(10, parseInt(args[0], 10) || 100))
    const answer = randomInt(1, max)

    setSession(m.chat, {
      type: 'math',
      answer,
      money: Math.round(max / 2) + 50,
      xp: 15,
      expiresAt: Date.now() + 120_000
    })

    await m.reply(
      `♟ *ADIVINA EL NÚMERO*\n\n` +
      `🔢 He pensado un número entre *1* y *${max}*.\n` +
      `⏱️ Tienes 2 minutos.\n💰 Premio ☇ ${Math.round(max / 2) + 50} monedas\n\n` +
      `_Escribe tu respuesta en el chat._`
    )
  }
}
