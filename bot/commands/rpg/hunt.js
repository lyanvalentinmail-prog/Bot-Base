/** Caza animales para conseguir comida y materiales. */
import { addItem, db } from '../../database/index.js'
import { COOLDOWNS, HUNT_TABLE, rollTable, itemLabel } from '../../lib/rpgdata.js'
import { timeLeft, randomInt } from '../../lib/functions.js'
import { addXp } from '../../lib/levelling.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'hunt',
  aliases: ['cazar', 'caza'],
  category: 'rpg',
  args: '',
  description: 'Salir de caza',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const elapsed = Date.now() - (user.rpg.lastHunt || 0)
    if (elapsed < COOLDOWNS.hunt) {
      throw new UserError(`🏹 Los animales huyeron. Vuelve en *${timeLeft(COOLDOWNS.hunt - elapsed)}*.`)
    }
    if (user.rpg.health < 20) throw new UserError('🩸 Estás muy herido. Usa *.heal* antes de cazar.')

    const hasSword = (user.inventory.sword || 0) > 0
    const drops = []
    for (let i = 0; i < (hasSword ? 3 : 2); i++) {
      const drop = rollTable(HUNT_TABLE)
      addItem(user, drop.item, drop.amount)
      drops.push(`${itemLabel(drop.item)} ×${drop.amount}`)
    }

    const damage = hasSword ? randomInt(0, 8) : randomInt(5, 18)
    user.rpg.health = Math.max(1, user.rpg.health - damage)
    const xp = randomInt(12, 28)
    addXp(user, xp)
    user.rpg.lastHunt = Date.now()
    db.data.users[user.id].rpg = user.rpg
    db.data.users[user.id].xp = user.xp
    db.data.users[user.id].level = user.level
    db.markDirty()

    await m.reply(
      `🏹 *CAZA*${hasSword ? ' (con espada ⚔️)' : ''}\n\n` +
      `${drops.join('\n')}\n\n` +
      `❤️ Salud ☇ ${user.rpg.health}/100 (-${damage})\n★ +${xp} XP`
    )
  }
}
