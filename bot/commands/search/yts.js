/** Busqueda de videos publicos en YouTube (yt-dlp). */
import ytdlp, { formatDuration } from '../../lib/ytdlp.js'
import { UserError } from '../../lib/errors.js'
import { formatNumber } from '../../lib/functions.js'

export default {
  name: 'yts',
  aliases: ['ytsearch', 'youtube'],
  category: 'search',
  args: '<consulta>',
  description: 'Buscar vídeos en YouTube',
  example: 'yts lofi hip hop',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, text, prefix }) {
    await m.react('🔎')
    const results = await ytdlp.search(text, 5)
    if (!results.length) throw new UserError(`❌ Sin resultados para *${text}*.`)

    const list = results.map((video, index) =>
      `${index + 1}. *${video.title}*\n` +
      `   👤 ${video.channel} · ⏱️ ${formatDuration(video.duration)} · 👁️ ${formatNumber(video.views)}\n` +
      `   🔗 ${video.url}`
    ).join('\n\n')

    await m.reply(
      `⌕ *Resultados de YouTube para:* ${text}\n\n${list}\n\n` +
      `_Descarga con_ *${prefix}ytmp3 <url>* _o_ *${prefix}ytmp4 <url>*`
    )
  }
}
