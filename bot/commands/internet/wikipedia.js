/** Busqueda en Wikipedia (API oficial de MediaWiki + REST summary). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { truncate } from '../../lib/functions.js'

export default {
  name: 'wikipedia',
  aliases: ['wiki'],
  category: 'internet',
  args: '<término>',
  description: 'Buscar un artículo en Wikipedia',
  example: 'wikipedia agujero negro',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    await m.react('🔎')
    const search = await apiGet('https://es.wikipedia.org/w/api.php', {
      params: { action: 'query', list: 'search', srsearch: text, format: 'json', srlimit: 1, origin: '*' }
    }, 'Wikipedia')

    const first = search?.query?.search?.[0]
    if (!first) throw new UserError(`❌ No encontré artículos sobre *${text}*.`)

    const summary = await apiGet(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.title)}`,
      {}, 'Wikipedia'
    )

    const caption =
      `📚 *${summary.title}*\n` +
      (summary.description ? `_${summary.description}_\n` : '') +
      `\n${truncate(summary.extract || '', 900)}\n\n` +
      `🔗 ${summary.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${encodeURIComponent(first.title)}`}`

    if (summary.thumbnail?.source) {
      const { fetchBuffer } = await import('../../lib/apiClient.js')
      const { buffer } = await fetchBuffer(summary.thumbnail.source, {}, 'Wikipedia').catch(() => ({ buffer: null }))
      if (buffer) { await m.reply({ image: buffer, caption }); return }
    }
    await m.reply(caption)
  }
}
