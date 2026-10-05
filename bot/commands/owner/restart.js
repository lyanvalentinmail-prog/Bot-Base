/** Reinicia el proceso del bot. */
import { db } from '../../database/index.js'
import { sleep } from '../../lib/functions.js'

export default {
  name: 'restart',
  aliases: ['reiniciar'],
  category: 'owner',
  args: '',
  description: 'Reiniciar el bot',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m }) {
    await m.reply(
      '♻️ Reiniciando...\n\n' +
      '_Si lo ejecutas con `npm start` sin gestor de procesos, tendrás que volver a iniciarlo a mano._\n' +
      '_Con pm2 o `npm run dev` se levanta solo._'
    )
    await db.save(true)
    await sleep(1200)
    process.exit(0)
  }
}
