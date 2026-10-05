/** Vista previa oficial de 30 s desde la API publica de Deezer. */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'deezer',
  aliases: ['preview'],
  category: 'sound',
  args: '<canción>',
  description: 'Vista previa de 30 s de una canción (Deezer)',
  example: 'deezer blinding lights',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, text }) {
    const data = await apiGet('https://api.deezer.com/search', {
      params: { q: text, limit: 1 }
    }, 'Deezer')

    const track = data?.data?.[0]
    if (!track) throw new UserError(`❌ No encontré *${text}* en Deezer.`)
    if (!track.preview) throw new UserError('❌ Esa canción no tiene vista previa pública.')

    const { buffer } = await fetchBuffer(track.preview, {}, 'Deezer')
    await m.reply({
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: `${track.title.slice(0, 50)}.mp3`
    })
    await m.reply(
      `🎵 *${track.title}*\n🎤 ${track.artist?.name}\n💿 ${track.album?.title}\n\n` +
      `▶️ Vista previa oficial de 30 s (Deezer)\n🔗 ${track.link}`
    )
  }
}
