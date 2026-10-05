/** Genera imagenes con la API de OpenAI (comando premium). */
import { openai } from '../../lib/apiClient.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'imagine',
  aliases: ['imaginar', 'dalle'],
  category: 'ai',
  args: '<prompt>',
  description: 'Generar una imagen con IA',
  example: 'imagine un gato astronauta en acuarela',
  limit: true,
  premium: true,
  owner: false,
  admin: false,
  cooldown: 30,

  async exec ({ m, text }) {
    const prompt = text || m.quoted?.text
    if (!prompt) throw new UserError('🎨 Describe la imagen que quieres.\nEjemplo: *.imagine un dragón de cristal*')
    if (prompt.length > 900) throw new UserError('🎨 La descripción es demasiado larga (máx. 900 caracteres).')

    await m.react('🎨')
    await m.reply('🎨 Generando la imagen... esto puede tardar hasta un minuto.')

    const image = await openai.image(prompt)
    await m.reply({ image, caption: `◇ *Imagen generada*\n\n📝 ${prompt}` })
  }
}
