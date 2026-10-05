/** Descarga el audio de un vídeo público de YouTube (yt-dlp + ffmpeg). */
import ytdlp, { formatDuration } from '../../lib/ytdlp.js'
import { fetchBuffer } from '../../lib/apiClient.js'
import { isYoutubeUrl } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ytmp3',
  aliases: ['ytaudio', 'yta'],
  category: 'downloader',
  args: '<url>',
  description: 'Descargar el audio de un vídeo de YouTube',
  example: 'ytmp3 https://youtu.be/dQw4w9WgXcQ',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 15,

  async exec ({ m, text }) {
    const url = text.trim().split(/\s+/)[0]
    if (!isYoutubeUrl(url)) throw new UserError('🔗 Envía un enlace válido de YouTube.')

    await m.react('⏬')
    const { buffer, meta } = await ytdlp.downloadAudio(url)

    const thumb = meta.thumbnail ? await fetchBuffer(meta.thumbnail).catch(() => null) : null
    await m.reply({
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: `${meta.title.replace(/[^\w\sáéíóúñü.-]/gi, '').slice(0, 60) || 'audio'}.mp3`,
      contextInfo: thumb?.buffer
        ? { externalAdReply: { title: meta.title.slice(0, 60), body: meta.channel, thumbnail: thumb.buffer, mediaType: 2, sourceUrl: meta.url } }
        : undefined
    })
    await m.react('✅')
    await m.reply(`🎵 *${meta.title}*\n👤 ${meta.channel}\n⏱️ ${formatDuration(meta.duration)}\n🔗 ${meta.url}`)
  }
}
