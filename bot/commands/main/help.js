/** Ayuda detallada de un comando concreto. */
import { usageOf, badgesOf } from '../../lib/menu.js'
import { getCategory } from '../../lib/categories.js'

export default {
  name: 'info-comando',
  aliases: ['cmd', 'uso', 'howto'],
  category: 'main',
  args: '<comando>',
  description: 'Ver la ayuda detallada de un comando',
  example: 'cmd sticker',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args, registry, prefix }) {
    const name = (args[0] || '').replace(prefix, '').toLowerCase()
    const command = registry.resolve(name)
    if (!command) {
      await m.reply(`❌ No encontré el comando *${name}*.\nUsa *${prefix}menu* para ver todos los comandos.`)
      return
    }

    const category = getCategory(command.category)
    const badges = badgesOf(command)

    await m.reply(
      `╭─❏ *${command.name.toUpperCase()}*\n` +
      `│ 📂 Categoría ☇ ${category ? `${category.icon} ${category.label}` : command.category}\n` +
      `│ 📝 Descripción ☇ ${command.description}\n` +
      `│ ✏️ Uso ☇ ${usageOf(command, prefix)}\n` +
      (command.example ? `│ 💡 Ejemplo ☇ ${prefix}${command.example}\n` : '') +
      (command.aliases.length ? `│ 🔁 Alias ☇ ${command.aliases.map((a) => prefix + a).join(', ')}\n` : '') +
      `│ 🔐 Permisos ☇ ${badges || 'público'}\n` +
      (command.group ? '│ 👥 Solo en grupos\n' : '') +
      (command.private ? '│ 🔒 Solo en privado\n' : '') +
      `╰━━━━━━━━━━━━━━━⬣\n\n` +
      `_<> obligatorio · [] opcional_`
    )
  }
}
