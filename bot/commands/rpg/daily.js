/** Recompensa diaria. */
import { addMoney, db } from '../../database/index.js'
import { COOLDOWNS } from '../../lib/rpgdata.js'
import { timeLeft, randomInt, formatNumber } from '../../lib/functions.js'
import { addXp } from '../../lib/levelling.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'daily',
  aliases: ['diario', 'recompensa'],
  category: 'rpg',
  args: '',
  description: 'Reclamar la recompensa diaria',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const elapsed = Date.now() - (user.rpg.lastDaily || 0)
    if (elapsed < COOLDOWNS.daily) {
      throw new UserError(`⏳ Ya reclamaste tu recompensa.\nVuelve en *${timeLeft(COOLDOWNS.daily - elapsed)}*.`)
    }

    const money = randomInt(500, 1200) * (user.premium ? 2 : 1)
    const xp = randomInt(30, 80)
    addMoney(user, money)
    addXp(user, xp)
    user.rpg.lastDaily = Date.now()
    db.data.users[user.id].rpg = user.rpg
    db.data.users[user.id].xp = user.xp
    db.data.users[user.id].level = user.level
    db.markDirty()

    await m.reply(
      `🎁 *RECOMPENSA DIARIA*\n\n` +
      `💰 +${formatNumber(money)} monedas${user.premium ? ' (×2 premium)' : ''}\n` +
      `★ +${xp} XP\n\n` +
      `💳 Saldo ☇ ${formatNumber(user.money)} monedas`
    )
  }
}
