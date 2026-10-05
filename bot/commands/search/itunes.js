/** Busqueda de musica en el catalogo publico de iTunes (API oficial de Apple). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'itunes',
  aliases: ['musicsearch', 'applemusic'],
  category: 'search',
  args: '<canción>',
  description: 'Buscar canciones en el catálogo de iTunes',
  example: 'itunes daft punk',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const data = await apiGet('https://itunes.apple.com/search', {
      params: { term: text, media: 'music', limit: 5, country: 'US' }
    }, 'iTunes')

    const results = data?.results || []
    if (!results.length) throw new UserError(`❌ Sin resultados para *${text}*.`)

    const list = results.map((track, index) =>
      `${index + 1}. *${track.trackName}*\n` +
      `   🎤 ${track.artistName}\n` +
      `   💿 ${track.collectionName || '-'} (${(track.releaseDate || '').slice(0, 4)})\n` +
      `   ⏱️ ${Math.round((track.trackTimeMillis || 0) / 1000 / 60)} min · 🎧 ${track.previewUrl ? 'vista previa disponible' : '-'}`
    ).join('\n\n')

    await m.reply(`🎵 *iTunes* · ${text}\n\n${list}`)
  }
}
