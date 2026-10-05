/** Trabaja para ganar monedas. */
import { addMoney, db } from '../../database/index.js'
import { COOLDOWNS, WORK_JOBS } from '../../lib/rpgdata.js'
import { timeLeft, randomInt, pickRandom, formatNumber } from '../../lib/functions.js'
import { addXp } from '../../lib/levelling.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'work',
  aliases: ['trabajar', 'curro'],
  category: 'rpg',
  args: '',
  description: 'Trabajar para ganar monedas',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const elapsed = Date.now() - (user.rpg.lastWork || 0)
    if (elapsed < COOLDOWNS.work) {
      throw new UserError(`😴 Estás cansado. Descansa *${timeLeft(COOLDOWNS.work - elapsed)}* antes de volver a trabajar.`)
    }

    const job = pickRandom(WORK_JOBS)
    const money = randomInt(job.min, job.max)
    const xp = randomInt(8, 20)
    addMoney(user, money)
    addXp(user, xp)
    user.rpg.lastWork = Date.now()
    user.rpg.stamina = Math.max(0, user.rpg.stamina - 10)
    db.data.users[user.id].rpg = user.rpg
    db.data.users[user.id].xp = user.xp
    db.data.users[user.id].level = user.level
    db.markDirty()

    await m.reply(
      `⚔ *TRABAJO*\n\n` +
      `🧰 Trabajaste como *${job.name}*\n` +
      `💰 +${formatNumber(money)} monedas\n★ +${xp} XP\n⚡ Energía ☇ ${user.rpg.stamina}/100\n\n` +
      `💳 Saldo ☇ ${formatNumber(user.money)} monedas`
    )
  }
}
