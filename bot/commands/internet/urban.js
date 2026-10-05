/** Definiciones del Urban Dictionary (API publica). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { truncate } from '../../lib/functions.js'

export default {
  name: 'urban',
  aliases: ['urbandictionary', 'ud'],
  category: 'internet',
  args: '<término>',
  description: 'Buscar un término en Urban Dictionary',
  example: 'urban yeet',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const data = await apiGet('https://api.urbandictionary.com/v0/define', {
      params: { term: text }
    }, 'Urban Dictionary')

    const entry = data?.list?.sort((a, b) => b.thumbs_up - a.thumbs_up)?.[0]
    if (!entry) throw new UserError(`❌ No hay definiciones para *${text}*.`)

    await m.reply(
      `📕 *${entry.word}*\n\n` +
      `📝 *Definición:*\n${truncate(entry.definition.replace(/[[\]]/g, ''), 800)}\n\n` +
      (entry.example ? `💬 *Ejemplo:*\n_${truncate(entry.example.replace(/[[\]]/g, ''), 400)}_\n\n` : '') +
      `👍 ${entry.thumbs_up}  👎 ${entry.thumbs_down}`
    )
  }
}
