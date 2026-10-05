/** Mina recursos. */
import { addItem, db } from '../../database/index.js'
import { COOLDOWNS, MINE_TABLE, rollTable, itemLabel } from '../../lib/rpgdata.js'
import { timeLeft, randomInt } from '../../lib/functions.js'
import { addXp } from '../../lib/levelling.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'mine',
  aliases: ['minar', 'mina'],
  category: 'rpg',
  args: '',
  description: 'Minar para conseguir materiales',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user }) {
    const elapsed = Date.now() - (user.rpg.lastMine || 0)
    if (elapsed < COOLDOWNS.mine) {
      throw new UserError(`⛏️ La mina se derrumbó. Vuelve en *${timeLeft(COOLDOWNS.mine - elapsed)}*.`)
    }

    const hasPickaxe = (user.inventory.pickaxe || 0) > 0
    const drops = []
    const rolls = hasPickaxe ? 3 : 2
    for (let i = 0; i < rolls; i++) {
      const drop = rollTable(MINE_TABLE)
      addItem(user, drop.item, drop.amount)
      drops.push(`${itemLabel(drop.item)} ×${drop.amount}`)
    }

    const xp = randomInt(10, 25)
    addXp(user, xp)
    user.rpg.lastMine = Date.now()
    db.data.users[user.id].rpg = user.rpg
    db.data.users[user.id].xp = user.xp
    db.data.users[user.id].level = user.level
    db.markDirty()

    await m.reply(
      `⛏️ *MINERÍA*${hasPickaxe ? ' (con pico ⛏️)' : ''}\n\n` +
      `${drops.join('\n')}\n\n★ +${xp} XP`
    )
  }
}
