/** Aventura aleatoria con eventos. */
import { addMoney, db } from '../../database/index.js'
import { COOLDOWNS, ADVENTURE_EVENTS } from '../../lib/rpgdata.js'
import { timeLeft, randomInt, pickRandom, formatNumber } from '../../lib/functions.js'
import { addXp } from '../../lib/levelling.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'adventure',
  aliases: ['aventura', 'explorar'],
  category: 'rpg',
  args: '',
  description: 'Salir de aventura',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const elapsed = Date.now() - (user.rpg.lastAdventure || 0)
    if (elapsed < COOLDOWNS.adventure) {
      throw new UserError(`🗺️ Aún te recuperas del viaje. Vuelve en *${timeLeft(COOLDOWNS.adventure - elapsed)}*.`)
    }
    if (user.rpg.health < 30) throw new UserError('🩸 Necesitas al menos 30 de salud. Usa *.heal*.')

    const event = pickRandom(ADVENTURE_EVENTS)
    const money = randomInt(event.money[0], event.money[1])
    const armorBonus = (user.inventory.armor || 0) > 0 ? 0.5 : 1
    const health = Math.round(event.health * (event.health < 0 ? armorBonus : 1))

    addMoney(user, money)
    user.rpg.health = Math.min(100, Math.max(1, user.rpg.health + health))
    const xp = randomInt(20, 45)
    addXp(user, xp)
    user.rpg.lastAdventure = Date.now()
    db.data.users[user.id].rpg = user.rpg
    db.data.users[user.id].xp = user.xp
    db.data.users[user.id].level = user.level
    db.markDirty()

    await m.reply(
      `🗺️ *AVENTURA*\n\n` +
      `📜 ${event.text}\n\n` +
      `💰 ${money >= 0 ? '+' : ''}${formatNumber(money)} monedas\n` +
      `❤️ ${health >= 0 ? '+' : ''}${health} salud ☇ ${user.rpg.health}/100\n` +
      `★ +${xp} XP\n\n` +
      `💳 Saldo ☇ ${formatNumber(user.money)} monedas`
    )
  }
}
