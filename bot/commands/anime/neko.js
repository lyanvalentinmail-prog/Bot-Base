/** Imagenes y gifs de nekos.best (API publica documentada, con atribucion). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { convert, ffmpegAvailable } from '../../lib/ffmpeg.js'

const IMAGE_CATEGORIES = ['neko', 'kitsune', 'husbando', 'waifu']
const GIF_CATEGORIES = ['hug', 'pat', 'kiss', 'punch', 'slap', 'cuddle', 'dance', 'laugh', 'poke', 'smile', 'wave', 'highfive', 'handhold', 'bite', 'blush', 'cry', 'happy', 'nod', 'pout', 'shoot', 'sleep', 'smug', 'stare', 'think', 'thumbsup', 'tickle', 'wink', 'yeet']

export default {
  name: 'neko',
  aliases: ['nekos', 'animegif'],
  category: 'anime',
  args: '[categoría]',
  description: 'Imagen o gif de anime de nekos.best',
  example: 'neko hug',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 4,

  async exec ({ m, args }) {
    const category = (args[0] || 'neko').toLowerCase()
    if (![...IMAGE_CATEGORIES, ...GIF_CATEGORIES].includes(category)) {
      throw new UserError(
        `✿ *Imágenes:* ${IMAGE_CATEGORIES.join(' · ')}\n\n` +
        `🎞️ *Gifs:* ${GIF_CATEGORIES.join(' · ')}`
      )
    }

    const data = await apiGet(`https://nekos.best/api/v2/${category}`, {}, 'nekos.best')
    const result = data?.results?.[0]
    if (!result?.url) throw new UserError('❌ No se obtuvo ningún resultado.')

    const { buffer } = await fetchBuffer(result.url, {}, 'nekos.best')
    const credit = result.artist_name
      ? `🎨 ${result.artist_name}${result.source_url ? `\n🔗 ${result.source_url}` : ''}`
      : (result.anime_name ? `🎬 ${result.anime_name}` : '')

    if (GIF_CATEGORIES.includes(category)) {
      // nekos.best devuelve GIF: WhatsApp necesita MP4 para animarlo.
      if (!ffmpegAvailable()) {
        throw new UserError('🎞️ Necesito *ffmpeg* para enviar gifs.\nTermux: `pkg install ffmpeg -y`')
      }
      const mp4 = await convert(buffer, 'gif', 'mp4', [
        '-movflags', 'faststart', '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
      ])
      await m.reply({ video: mp4, gifPlayback: true, caption: `✿ *${category}*\n${credit}` })
    } else {
      await m.reply({ image: buffer, caption: `✿ *${category}*\n${credit}` })
    }
  }
}
