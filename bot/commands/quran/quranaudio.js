/** Recitacion en audio de una aleya (Mishary Alafasy, via Al Quran Cloud). */
import { apiGet, fetchBuffer } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'quranaudio',
  aliases: ['recitacion', 'tilawah'],
  category: 'quran',
  args: '<sura:aleya>',
  description: 'Escuchar la recitación de una aleya',
  example: 'quranaudio 1:1',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 6,

  async exec ({ m, text }) {
    const reference = text.trim().replace(/\s+/g, '')
    if (!/^\d{1,3}:\d{1,3}$/.test(reference)) throw new UserError('۞ Formato: *.quranaudio 1:1* (sura:aleya)')

    const data = await apiGet(`https://api.alquran.cloud/v1/ayah/${reference}/ar.alafasy`, {}, 'Al Quran Cloud')
    const audioUrl = data?.data?.audio
    if (!audioUrl) throw new UserError('❌ No hay audio disponible para esa aleya.')

    const { buffer } = await fetchBuffer(audioUrl, {}, 'Al Quran Cloud')
    await m.reply({
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: `quran-${reference.replace(':', '-')}.mp3`
    })
    await m.reply(
      `۞ *${data.data.surah.englishName}* ${reference}\n\n${data.data.text}\n\n🎙️ _Recitado por Mishary Rashid Alafasy_`
    )
  }
}
