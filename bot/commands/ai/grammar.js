/** Corrige la ortografia y la gramatica de un texto (OpenAI). */
import { openai } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'grammar',
  aliases: ['corregir', 'ortografia'],
  category: 'ai',
  args: '<texto>',
  description: 'Corregir ortografía y gramática',
  example: 'grammar ola k ase',
  limit: true,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 8,

  async exec ({ m, text }) {
    const content = text || m.quoted?.text
    if (!content) throw new UserError('✏️ Escribe el texto a corregir o responde a un mensaje.')
    if (content.length > 2000) throw new UserError('✏️ Máximo 2000 caracteres.')

    await m.react('📝')
    const answer = await openai.chat([
      {
        role: 'system',
        content: 'Corrige la ortografía, la gramática y la puntuación del texto del usuario manteniendo su idioma, tono e intención. Responde SOLO con el texto corregido y, si hubo cambios relevantes, añade al final una línea "Cambios:" con un resumen muy breve.'
      },
      { role: 'user', content }
    ], { temperature: 0.2 })

    await m.reply(`📝 *Texto corregido*\n\n${answer}`)
  }
}
