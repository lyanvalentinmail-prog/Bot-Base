/** Respuestas instantaneas de DuckDuckGo (API oficial). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { truncate } from '../../lib/functions.js'

export default {
  name: 'ddg',
  aliases: ['duckduckgo', 'buscar'],
  category: 'internet',
  args: '<consulta>',
  description: 'Buscar una respuesta rápida en DuckDuckGo',
  example: 'ddg quién inventó la radio',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    await m.react('🦆')
    const data = await apiGet('https://api.duckduckgo.com/', {
      params: { q: text, format: 'json', no_html: 1, skip_disambig: 1, t: 'bot-base' }
    }, 'DuckDuckGo')

    const related = (data.RelatedTopics || [])
      .filter((topic) => topic.Text)
      .slice(0, 5)
      .map((topic, index) => `${index + 1}. ${truncate(topic.Text, 160)}\n   ${topic.FirstURL}`)

    if (!data.AbstractText && !related.length) {
      throw new UserError(`❌ DuckDuckGo no tiene una respuesta directa para *${text}*.`)
    }

    await m.reply(
      `🦆 *DuckDuckGo* · ${text}\n\n` +
      (data.AbstractText ? `📖 ${truncate(data.AbstractText, 700)}\n${data.AbstractURL ? `🔗 ${data.AbstractURL}\n` : ''}` : '') +
      (related.length ? `\n*Relacionado:*\n${related.join('\n')}` : '')
    )
  }
}
