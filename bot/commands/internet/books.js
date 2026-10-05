/** Busqueda de libros en Open Library (API publica de Internet Archive). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'libro',
  aliases: ['book', 'openlibrary'],
  category: 'internet',
  args: '<título>',
  description: 'Buscar libros en Open Library',
  example: 'libro cien años de soledad',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const data = await apiGet('https://openlibrary.org/search.json', {
      params: { q: text, limit: 5, fields: 'title,author_name,first_publish_year,key,edition_count,language' }
    }, 'Open Library')

    const docs = data?.docs || []
    if (!docs.length) throw new UserError(`❌ No encontré libros con *${text}*.`)

    const list = docs.map((doc, index) =>
      `${index + 1}. *${doc.title}*\n` +
      `   ✍️ ${(doc.author_name || ['Autor desconocido']).slice(0, 2).join(', ')}\n` +
      `   📅 ${doc.first_publish_year || '-'} · 📚 ${doc.edition_count || 1} ediciones\n` +
      `   🔗 https://openlibrary.org${doc.key}`
    ).join('\n\n')

    await m.reply(`📚 *Resultados para:* ${text}\n\n${list}`)
  }
}
