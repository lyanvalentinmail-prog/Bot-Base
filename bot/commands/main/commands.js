/** Listado completo de todos los comandos registrados. */
import { buildFullMenu } from '../../lib/menu.js'
import { chunkText } from '../../lib/functions.js'

export default {
  name: 'commands',
  aliases: ['comandos', 'listcmd', 'cmds'],
  category: 'main',
  args: '',
  description: 'Listar todos los comandos disponibles',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, registry, prefix }) {
    const text = buildFullMenu(registry, prefix)
    const parts = chunkText(text, 3500)
    for (const part of parts) await m.reply(part)
  }
}
