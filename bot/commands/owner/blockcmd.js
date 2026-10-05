/** Desactiva un comando globalmente. */
import { disableCommand, enableCommand, db } from '../../database/index.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'blockcmd',
  aliases: ['desactivarcmd', 'unblockcmd'],
  category: 'owner',
  args: '<comando>',
  description: 'Activar/desactivar un comando globalmente',
  example: 'blockcmd imagine',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, args, registry, commandName }) {
    const name = (args[0] || '').toLowerCase()
    const command = registry.resolve(name)
    if (!command) throw new UserError(`❌ El comando *${name}* no existe.`)

    const unblocking = commandName === 'unblockcmd' || commandName === 'desbloquearcmd'
    const isDisabled = db.settings.disabledCommands.includes(command.name)

    if (unblocking || isDisabled) {
      enableCommand(command.name)
      await m.reply(`✅ Comando *${command.name}* activado.`)
    } else {
      disableCommand(command.name)
      await m.reply(`🚫 Comando *${command.name}* desactivado globalmente.`)
    }
  }
}
