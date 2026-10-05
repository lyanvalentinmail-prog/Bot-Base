/** Intenta robar monedas a otro usuario (con riesgo). */
import { getUser, addMoney, db } from '../../database/index.js'
import { COOLDOWNS } from '../../lib/rpgdata.js'
import { timeLeft, randomInt, formatNumber } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'rob',
  aliases: ['robar'],
  category: 'rpg',
  args: '<@usuario>',
  description: 'Intentar robar monedas a alguien',
  example: 'rob @amigo',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  group: true,
  cooldown: 10,

  async exec ({ m, user }) {
    const elapsed = Date.now() - (user.rpg.lastRob || 0)
    if (elapsed < COOLDOWNS.rob) {
      throw new UserError(`🚓 La policía te vigila. Espera *${timeLeft(COOLDOWNS.rob - elapsed)}*.`)
    }

    const targetJid = m.mentionedJid[0] || m.quoted?.sender
    if (!targetJid) throw new UserError('🦹 Menciona a tu víctima.\nEjemplo: *.rob @amigo*')
    if (targetJid === m.sender) throw new UserError('🙃 No puedes robarte a ti mismo.')

    const target = getUser(targetJid)
    if (target.money < 100) throw new UserError('🪙 Esa persona casi no tiene monedas, déjala en paz.')

    user.rpg.lastRob = Date.now()
    db.data.users[user.id].rpg = user.rpg

    const success = Math.random() < 0.45
    if (!success) {
      const fine = Math.min(user.money, randomInt(100, 400))
      addMoney(user, -fine)
      await m.reply(
        `🚔 *¡Te atraparon!*\n\n💸 Multa ☇ ${formatNumber(fine)} monedas\n💳 Saldo ☇ ${formatNumber(user.money)}`
      )
      return
    }

    const stolen = Math.min(target.money, randomInt(50, Math.max(60, Math.floor(target.money * 0.2))))
    addMoney(target, -stolen)
    addMoney(user, stolen)

    await m.reply(
      `🦹 *¡Robo exitoso!*\n\n` +
      `💰 Robaste ${formatNumber(stolen)} monedas a @${targetJid.split('@')[0]}\n` +
      `💳 Saldo ☇ ${formatNumber(user.money)}`,
      { mentions: [targetJid] }
    )
  }
}
