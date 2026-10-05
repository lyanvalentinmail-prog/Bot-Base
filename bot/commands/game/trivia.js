/** Trivia con preguntas de Open Trivia Database (API publica). */
import { apiGet } from '../../lib/apiClient.js'
import { setSession, hasSession } from '../../lib/games.js'
import { shuffle, stripHtml } from '../../lib/functions.js'
import { UserError } from '../../lib/errors.js'

export default {
  name: 'trivia',
  aliases: ['preguntados', 'quiz'],
  category: 'game',
  args: '',
  description: 'Responder una pregunta de trivia',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  cooldown: 10,

  async exec ({ m }) {
    if (hasSession(m.chat)) throw new UserError('🎮 Ya hay un juego activo en este chat.')

    const data = await apiGet('https://opentdb.com/api.php', {
      params: { amount: 1, type: 'multiple', encode: 'url3986' }
    }, 'Open Trivia DB')

    const question = data?.results?.[0]
    if (!question) throw new UserError('❌ No se pudo obtener ninguna pregunta.')

    const decode = (value) => stripHtml(decodeURIComponent(value))
    const correct = decode(question.correct_answer)
    const options = shuffle([correct, ...question.incorrect_answers.map(decode)])
    const letters = ['A', 'B', 'C', 'D']
    const answerIndex = options.indexOf(correct)

    setSession(m.chat, {
      type: 'trivia',
      answer: letters[answerIndex],
      answerText: correct,
      money: 120,
      xp: 20,
      expiresAt: Date.now() + 45_000
    })

    await m.reply(
      `♟ *TRIVIA*\n\n` +
      `📚 Categoría ☇ ${decode(question.category)}\n` +
      `⭐ Dificultad ☇ ${decode(question.difficulty)}\n\n` +
      `❓ ${decode(question.question)}\n\n` +
      options.map((option, index) => `*${letters[index]})* ${option}`).join('\n') +
      `\n\n⏱️ 45 segundos · 💰 120 monedas\n_Responde con A, B, C o D._`
    )
  }
}
