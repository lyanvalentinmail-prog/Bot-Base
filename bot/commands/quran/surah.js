/** Informacion de las suras del Coran (API publica Al Quran Cloud). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { chunkText } from '../../lib/functions.js'

export default {
  name: 'surah',
  aliases: ['sura', 'quran'],
  category: 'quran',
  args: '[número]',
  description: 'Listar las suras o ver una en concreto',
  example: 'surah 36',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 5,

  async exec ({ m, args, prefix }) {
    const number = parseInt(args[0], 10)

    if (!number) {
      const data = await apiGet('https://api.alquran.cloud/v1/surah', {}, 'Al Quran Cloud')
      const list = (data?.data || []).map((s) =>
        `${String(s.number).padStart(3, ' ')}. ${s.englishName} (${s.name}) · ${s.numberOfAyahs} aleyas`
      ).join('\n')
      for (const part of chunkText(`۞ *SURAS DEL CORÁN*\n\n${list}\n\n_Usa_ *${prefix}surah <número>*`, 3500)) {
        await m.reply(part)
      }
      return
    }

    if (number < 1 || number > 114) throw new UserError('۞ El número de sura debe estar entre 1 y 114.')

    const data = await apiGet(
      `https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.asad`,
      {}, 'Al Quran Cloud'
    )
    const [arabic, translation] = data?.data || []
    if (!arabic) throw new UserError('❌ No se pudo obtener la sura.')

    const ayahs = arabic.ayahs.slice(0, 15).map((ayah, index) =>
      `*${ayah.numberInSurah}.* ${ayah.text}\n_${translation?.ayahs?.[index]?.text || ''}_`
    ).join('\n\n')

    const header =
      `۞ *${arabic.englishName}* (${arabic.name})\n` +
      `📖 Sura ${arabic.number} · ${arabic.numberOfAyahs} aleyas · ${arabic.revelationType}\n` +
      `_Traducción al inglés: Muhammad Asad_\n\n`

    for (const part of chunkText(header + ayahs + (arabic.ayahs.length > 15
      ? `\n\n_Mostrando 15 de ${arabic.ayahs.length} aleyas. Usa ${'`'}${'.'}ayah ${number}:16${'`'} para seguir._`
      : ''), 3500)) {
      await m.reply(part)
    }
  }
}
