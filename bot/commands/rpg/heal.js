/** Usa una pocion para recuperar salud. */
import { addItem, db } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'heal',
  aliases: ['curar', 'pocion'],
  category: 'rpg',
  args: '',
  description: 'Usar una poción para recuperar salud',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, user, prefix }) {
    if (user.rpg.health >= 100) throw new UserError('❤️ Ya tienes la salud al máximo.')
    if ((user.inventory.potion || 0) < 1) {
      throw new UserError(`🧪 No tienes pociones.\nCómpralas con *${prefix}buy potion 1*`)
    }

    addItem(user, 'potion', -1)
    user.rpg.health = Math.min(100, user.rpg.health + 50)
    db.data.users[user.id].rpg = user.rpg
    db.markDirty()

    await m.reply(
      `🧪 *Poción usada*\n\n❤️ Salud ☇ ${user.rpg.health}/100\n🎒 Pociones restantes ☇ ${user.inventory.potion}`
    )
  }
}
