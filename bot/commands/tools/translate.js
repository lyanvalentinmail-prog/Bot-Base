/** Traductor con MyMemory (https://mymemory.translated.net/doc/spec.php). */
import { apiGet } from '../../lib/apiClient.js'

export default {
  name: 'translate',
  aliases: ['traducir', 'tr'],
  category: 'tools',
  args: '<idioma> <texto>',
  description: 'Traducir texto a otro idioma',
  example: 'translate en Hola, ¿cómo estás?',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args, text }) {
    let target = (args[0] || '').toLowerCase()
    let source = 'autodetect'
    let content = args.slice(1).join(' ')

    if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(target)) {
      await m.reply('🌍 Indica el idioma destino con su código.\nEjemplo: *.translate en Hola mundo*')
      return
    }
    if (!content && m.quoted?.text) content = m.quoted.text
    if (!content) {
      await m.reply('✏️ Escribe el texto a traducir o responde a un mensaje.')
      return
    }
    if (content.length > 500) content = content.slice(0, 500)

    // MyMemory necesita un idioma de origen: se usa una deteccion simple.
    source = /[áéíóúñü¿¡]/i.test(content) ? 'es' : 'en'
    if (source === target) source = target === 'es' ? 'en' : 'es'

    const data = await apiGet('https://api.mymemory.translated.net/get', {
      params: { q: content, langpair: `${source}|${target}` }
    }, 'MyMemory')

    const translated = data?.responseData?.translatedText
    if (!translated) {
      await m.reply('❌ No se pudo traducir el texto.')
      return
    }

    await m.reply(
      `🌍 *Traducción* (${source} ➜ ${target})\n\n` +
      `📄 *Original:*\n${content}\n\n` +
      `✅ *Resultado:*\n${translated}`
    )
  }
}
