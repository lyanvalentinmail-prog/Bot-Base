/** Menciona a todos sin mostrar la lista de etiquetas. */
export default {
  name: 'hidetag',
  aliases: ['notificar', 'ht'],
  category: 'panel',
  args: '[mensaje]',
  description: 'Notificar a todos sin mostrar menciones',
  example: 'hidetag buenos días',
  limit: false,
  premium: false,
  owner: false,
  admin: true,
  group: true,
  cooldown: 20,

  async exec ({ sock, m, text, metadata }) {
    const mentions = (metadata?.participants || []).map((p) => p.id)
    await sock.sendMessage(m.chat, {
      text: text || m.quoted?.text || '📢',
      mentions
    })
  }
}
