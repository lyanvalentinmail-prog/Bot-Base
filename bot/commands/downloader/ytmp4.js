/** Descarga un vídeo público de YouTube (yt-dlp). */
import ytdlp, { formatDuration } from '../../lib/ytdlp.js'
import { isYoutubeUrl, formatBytes } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ytmp4',
  aliases: ['ytvideo', 'ytv'],
  category: 'downloader',
  args: '<url> [calidad]',
  description: 'Descargar un vídeo de YouTube (144-1080)',
  example: 'ytmp4 https://youtu.be/dQw4w9WgXcQ 720',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 20,

  async exec ({ m, args }) {
    const url = (args[0] || '').trim()
    const quality = (args[1] || '480').replace(/\D/g, '') || '480'
    if (!isYoutubeUrl(url)) throw new UserError('🔗 Envía un enlace válido de YouTube.\nEjemplo: *.ytmp4 <url> 720*')

    await m.react('⏬')
    const { buffer, meta, height } = await ytdlp.downloadVideo(url, { quality })

    await m.reply({
      video: buffer,
      mimetype: 'video/mp4',
      fileName: `${meta.title.replace(/[^\w\sáéíóúñü.-]/gi, '').slice(0, 60) || 'video'}.mp4`,
      caption:
        `🎬 *${meta.title}*\n👤 ${meta.channel}\n⏱️ ${formatDuration(meta.duration)}\n` +
        `📺 ${height}p · 📦 ${formatBytes(buffer.length)}\n🔗 ${meta.url}`
    })
    await m.react('✅')
  }
}
