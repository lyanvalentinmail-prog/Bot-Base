/** La bola 8 responde preguntas de si/no. */
import { pickRandom } from '../../lib/functions.js'

const ANSWERS = [
  'Sí, sin duda 🎱', 'Es cierto ✅', 'Lo veo muy probable 🌟', 'Todo apunta a que sí 👍',
  'Pregúntame más tarde ⏳', 'Mejor no te lo digo ahora 🤐', 'No puedo predecirlo 🌫️',
  'No cuentes con ello ❌', 'Mi respuesta es no 🙅', 'Muy dudoso 😬', 'Definitivamente sí 💯',
  'Las señales dicen que sí ✨', 'Olvídalo 💤'
]

export default {
  name: '8ball',
  aliases: ['bola8', 'bola'],
  category: 'fun',
  args: '<pregunta>',
  description: 'La bola mágica responde tu pregunta',
  example: '8ball ¿aprobaré el examen?',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    await m.reply(`🎱 *Pregunta:* ${text}\n\n🔮 *Respuesta:* ${pickRandom(ANSWERS)}`)
  }
}
