/** Una aleya concreta del Coran, en arabe y traducida. */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'ayah',
  aliases: ['aleya', 'versiculo'],
  category: 'quran',
  args: '<sura:aleya>',
  description: 'Ver una aleya concreta del Corán',
  example: 'ayah 2:255',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const reference = text.trim().replace(/\s+/g, '')
    if (!/^\d{1,3}:\d{1,3}$/.test(reference)) throw new UserError('۞ Formato: *.ayah 2:255* (sura:aleya)')

    const data = await apiGet(
      `https://api.alquran.cloud/v1/ayah/${reference}/editions/quran-uthmani,en.asad`,
      {}, 'Al Quran Cloud'
    )
    const [arabic, translation] = data?.data || []
    if (!arabic) throw new UserError('❌ No se encontró esa aleya.')

    await m.reply(
      `۞ *${arabic.surah.englishName}* ${arabic.surah.number}:${arabic.numberInSurah}\n\n` +
      `${arabic.text}\n\n` +
      `_${translation?.text || ''}_\n\n` +
      `📖 ${arabic.surah.name} · ${arabic.surah.revelationType}\n_Al Quran Cloud · traducción de Muhammad Asad_`
    )
  }
}
