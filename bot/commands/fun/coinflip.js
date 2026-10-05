/** Lanza una moneda al aire. */
export default {
  name: 'moneda',
  aliases: ['coinflip', 'cara', 'cruz'],
  category: 'fun',
  args: '',
  description: 'Lanzar una moneda al aire',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m }) {
    await m.react('🪙')
    const result = Math.random() < 0.5 ? 'CARA 🙂' : 'CRUZ ⚪'
    await m.reply(`🪙 La moneda gira...\n\n*${result}*`)
  }
}
