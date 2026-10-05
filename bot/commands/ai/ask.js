/** Preguntas a Google Gemini (requiere GEMINI_API_KEY). */
import config from '../../config.js'
import { gemini } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'
import { chunkText } from '../../lib/functions.js'

export default {
  name: 'ask',
  aliases: ['gemini', 'pregunta'],
  category: 'ai',
  args: '<pregunta>',
  description: 'Preguntar a Gemini (también analiza imágenes)',
  example: 'ask ¿cuál es la capital de Perú?',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, text }) {
    const prompt = text || m.quoted?.text
    if (!prompt && !m.quoted?.isMedia) {
      throw new UserError('💬 Escribe tu pregunta.\nEjemplo: *.ask ¿quién escribió el Quijote?*')
    }

    await m.react('🧠')

    // Si se responde a una imagen, se envia junto a la pregunta.
    const images = []
    if (m.quoted?.isMedia && /image/.test(m.quoted.mime)) {
      const buffer = await m.quoted.download().catch(() => null)
      if (buffer) images.push({ buffer, mime: m.quoted.mime })
    }

    const answer = await gemini.generate(prompt || 'Describe esta imagen en español.', {
      system: `Eres ${config.botName}, un asistente de WhatsApp. Responde siempre en español, de forma clara y concisa.`,
      images
    })

    for (const part of chunkText(`◇ *Gemini*\n\n${answer}`, 3500)) await m.reply(part)
  }
}
