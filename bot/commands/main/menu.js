/**
 * Menu principal con banner y datos dinamicos.
 * Uso:
 *   .menu             -> banner + tarjeta + todos los comandos por categoria
 *   .menu <categoría> -> solo los comandos de esa categoria
 */
import fs from 'node:fs/promises'
import config from '../../config.js'
import { buildMainMenu, buildCategoryMenu, buildFullMenu, buildCategoryListText } from '../../lib/menu.js'
import { getCategory } from '../../lib/categories.js'
import { chunkText } from '../../lib/functions.js'

export default {
  name: 'menu',
  aliases: ['menú', 'help', 'ayuda', 'allmenu'],
  category: 'main',
  args: '[categoría]',
  description: 'Mostrar el menú del bot',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args, user, registry, prefix, settings, runtime }) {
    const query = (args[0] || '').toLowerCase()

    /* ─── Una categoría concreta ─── */
    if (query) {
      const category = getCategory(query)
      const text = buildCategoryMenu(registry, category?.id || query, prefix)
      if (!text) {
        await m.reply(
          `❌ No existe la categoría *${query}*.\n\n` +
          buildCategoryListText(registry, prefix)
        )
        return
      }
      await m.reply(text)
      return
    }

    /* ─── Menú completo: tarjeta + todos los comandos ─── */
    const card = buildMainMenu({
      userName: user.name || m.pushName || 'Usuario',
      registry,
      prefix,
      mode: settings.mode,
      uptimeMs: Date.now() - (runtime?.startedAt || Date.now()),
      status: runtime?.status || 'Activo'
    })

    const banner = await fs.readFile(config.paths.banner).catch(() => null)
    if (banner) await m.reply({ image: banner, caption: card })
    else await m.reply(card)

    // El listado completo va aparte y troceado: WhatsApp corta los mensajes largos.
    for (const part of chunkText(buildFullMenu(registry, prefix), 3500)) {
      await m.reply(part)
    }
  }
}
