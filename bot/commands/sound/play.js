/** Busca una cancion en YouTube y envia el audio (yt-dlp + ffmpeg). */
import ytdlp, { formatDuration } from '../../lib/ytdlp.js'
import { fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'play',
  aliases: ['musica', 'reproducir'],
  category: 'sound',
  args: '<canción>',
  description: 'Buscar y enviar una canción en audio',
  example: 'play bohemian rhapsody',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 20,

  async exec ({ m, text }) {
    await m.react('🔎')
    const [video] = await ytdlp.search(text, 1)
    if (!video) throw new UserError(`❌ No encontré nada para *${text}*.`)
    if (video.duration > 1800) throw new UserError('⏱️ La canción dura más de 30 minutos, prueba con otra.')

    await m.reply(`🎧 Descargando *${video.title}*...\n⏱️ ${formatDuration(video.duration)} · 👤 ${video.channel}`)

    const { buffer, meta } = await ytdlp.downloadAudio(video.url)
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
  }
}
