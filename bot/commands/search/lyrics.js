/** Letras de canciones (API publica lyrics.ovh). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { chunkText } from '../../lib/functions.js'

export default {
  name: 'lyrics',
  aliases: ['letra'],
  category: 'search',
  args: '<artista - canción>',
  description: 'Buscar la letra de una canción',
  example: 'lyrics coldplay - yellow',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 6,

  async exec ({ m, text }) {
    const [artist, ...rest] = text.split(/\s*[-–]\s*/)
    const title = rest.join('-').trim()
    if (!artist || !title) throw new UserError('🎤 Formato: *.lyrics artista - canción*')

    await m.react('🎶')
    let data
    try {
      data = await apiGet(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist.trim())}/${encodeURIComponent(title)}`,
        { timeout: 30_000 }, 'lyrics.ovh'
      )
    } catch {
      throw new UserError(`❌ No encontré la letra de *${artist.trim()} - ${title}*.`)
    }

    if (!data?.lyrics) throw new UserError(`❌ No encontré la letra de *${artist.trim()} - ${title}*.`)
    const parts = chunkText(`🎶 *${artist.trim()} - ${title}*\n\n${data.lyrics.trim()}`, 3500)
    for (const part of parts) await m.reply(part)
  }
}
