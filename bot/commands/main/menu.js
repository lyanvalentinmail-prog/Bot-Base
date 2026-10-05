/**
 * Menu principal con banner, datos dinamicos y boton de categorias.
 * Uso:
 *   .menu            -> banner + tarjeta + botón "📚 VER LISTA DE COMANDOS"
 *   .menu list       -> lista/categorías
 *   .menu <categoría> -> comandos de esa categoría
 */
import fs from 'node:fs/promises'
import config from '../../config.js'
import { sendInteractive } from '../../lib/buttons.js'
import {
  buildMainMenu, buildCategoryMenu, buildCategorySections, buildCategoryListText
} from '../../lib/menu.js'
import { getCategory } from '../../lib/categories.js'

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

  async exec ({ sock, m, args, user, registry, prefix, settings, runtime }) {
    const query = (args[0] || '').toLowerCase()

    /* ─── Lista de categorías ─── */
    if (['list', 'lista', 'categorias', 'categorías'].includes(query)) {
      const sections = buildCategorySections(registry, prefix)
      await sendInteractive(sock, m.chat, {
        title: `📚 Categorías de ${config.botName}`,
        body: buildCategoryListText(registry, prefix),
        footer: `${registry.total} comandos disponibles`,
        sections,
        listTitle: '📚 Elegir categoría',
        fallback: buildCategoryListText(registry, prefix),
        quoted: m.raw
      })
      return
    }

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

    /* ─── Menú principal ─── */
    const text = buildMainMenu({
      userName: user.name || m.pushName || 'Usuario',
      registry,
      prefix,
      mode: settings.mode,
      uptimeMs: Date.now() - (runtime?.startedAt || Date.now()),
      status: runtime?.status || 'Activo'
    })

    const banner = await fs.readFile(config.paths.banner).catch(() => null)

    await sendInteractive(sock, m.chat, {
      title: config.botName,
      body: text,
      footer: `${config.botName} v${config.botVersion}`,
      image: banner,
      buttons: [{ id: `${prefix}menu list`, text: '📚 VER LISTA DE COMANDOS' }],
      fallback: `${text}\n\n📚 *VER LISTA DE COMANDOS* ➜ escribe *${prefix}menu list*`,
      quoted: m.raw
    })
  }
}
