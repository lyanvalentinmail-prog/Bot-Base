/** Conversor de divisas con Frankfurter (tipos oficiales del BCE). */
import { apiGet } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { formatNumber } from '../../lib/functions.js'

export default {
  name: 'divisa',
  aliases: ['currency', 'convertir', 'cambio'],
  category: 'tools',
  args: '<cantidad> <origen> <destino>',
  description: 'Convertir entre divisas (tipos del BCE)',
  example: 'divisa 100 usd eur',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args }) {
    const amount = Number(String(args[0]).replace(',', '.'))
    const from = (args[1] || '').toUpperCase()
    const to = (args[2] || '').toUpperCase()
    if (!Number.isFinite(amount) || !/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
      throw new UserError('💱 Uso: *.divisa 100 usd eur*')
    }

    const data = await apiGet('https://api.frankfurter.app/latest', {
      params: { amount, from, to }
    }, 'Frankfurter')

    const result = data?.rates?.[to]
    if (result === undefined) throw new UserError(`❌ No hay tipo de cambio para ${from} ➜ ${to}.`)

    await m.reply(
      `💱 *Conversión de divisas*\n\n` +
      `${formatNumber(amount)} ${from} = *${result.toLocaleString('es-ES', { maximumFractionDigits: 4 })} ${to}*\n\n` +
      `📅 Tipo del ${data.date} · Banco Central Europeo`
    )
  }
}
