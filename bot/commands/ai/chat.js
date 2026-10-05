/** Conversacion con OpenAI (requiere OPENAI_API_KEY). */
import config from '../../config.js'
import { openai } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { chunkText } from '../../lib/functions.js'

export default {
  name: 'chat',
  aliases: ['gpt', 'ia'],
  category: 'ai',
  args: '<mensaje>',
  description: 'Hablar con la IA (OpenAI)',
  example: 'chat explícame la fotosíntesis',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, text, user }) {
    const prompt = text || m.quoted?.text
    if (!prompt) throw new UserError('💬 Escribe tu mensaje.\nEjemplo: *.chat ¿qué es un agujero negro?*')

    await m.react('🧠')
    const answer = await openai.chat([
      {
        role: 'system',
        content: `Eres ${config.botName}, un asistente de WhatsApp. Responde en español, de forma clara y breve (máximo 250 palabras) salvo que te pidan más detalle. El usuario se llama ${user.name || 'usuario'}.`
      },
      { role: 'user', content: prompt }
    ])

    for (const part of chunkText(`◇ *${config.botName} AI*\n\n${answer}`, 3500)) await m.reply(part)
  }
}
