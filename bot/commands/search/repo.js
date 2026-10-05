/** Busqueda de repositorios en GitHub (API oficial). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { formatNumber, truncate } from '../../lib/functions.js'

export default {
  name: 'repo',
  aliases: ['ghsearch', 'githubsearch'],
  category: 'search',
  args: '<consulta>',
  description: 'Buscar repositorios en GitHub',
  example: 'repo whatsapp bot',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const data = await apiGet('https://api.github.com/search/repositories', {
      params: { q: text, sort: 'stars', order: 'desc', per_page: 5 },
      headers: { Accept: 'application/vnd.github+json' }
    }, 'GitHub')

    const items = data?.items || []
    if (!items.length) throw new UserError(`❌ Sin resultados para *${text}*.`)

    const list = items.map((repo, index) =>
      `${index + 1}. *${repo.full_name}*\n` +
      `   ⭐ ${formatNumber(repo.stargazers_count)} · 🍴 ${formatNumber(repo.forks_count)} · ${repo.language || '-'}\n` +
      `   📝 ${truncate(repo.description || 'Sin descripción', 120)}\n` +
      `   🔗 ${repo.html_url}`
    ).join('\n\n')

    await m.reply(`⌕ *GitHub* · ${text}\n\n${list}`)
  }
}
