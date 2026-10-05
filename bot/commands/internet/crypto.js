/** Precio de criptomonedas (API publica de CoinGecko). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'crypto',
  aliases: ['cripto', 'coin'],
  category: 'internet',
  args: '<moneda>',
  description: 'Precio actual de una criptomoneda',
  example: 'crypto bitcoin',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 5,

  async exec ({ m, text }) {
    const query = text.trim().toLowerCase()
    const search = await apiGet('https://api.coingecko.com/api/v3/search', {
      params: { query }
    }, 'CoinGecko')

    const coin = search?.coins?.[0]
    if (!coin) throw new UserError(`❌ No encontré la criptomoneda *${text}*.`)

    const data = await apiGet('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coin.id,
        vs_currencies: 'usd,eur',
        include_24hr_change: true,
        include_market_cap: true
      }
    }, 'CoinGecko')

    const price = data?.[coin.id]
    if (!price) throw new UserError('❌ No hay datos de precio disponibles.')

    const change = price.usd_24h_change ?? 0
    await m.reply(
      `╭─❏ *${coin.name} (${coin.symbol.toUpperCase()})*\n` +
      `│ 💵 USD ☇ $${price.usd?.toLocaleString('en-US')}\n` +
      `│ 💶 EUR ☇ €${price.eur?.toLocaleString('de-DE')}\n` +
      `│ ${change >= 0 ? '📈' : '📉'} 24h ☇ ${change.toFixed(2)}%\n` +
      `│ 🏦 Cap. mercado ☇ $${Math.round(price.usd_market_cap || 0).toLocaleString('en-US')}\n` +
      `│ 🏅 Ranking ☇ #${coin.market_cap_rank || '-'}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n_Datos de CoinGecko_`
    )
  }
}
