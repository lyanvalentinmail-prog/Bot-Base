/** Comparte el contacto del propietario del bot. */
import config from '../../config.js'

export default {
  name: 'owner',
  aliases: ['propietario', 'creador', 'dueño'],
  category: 'info',
  args: '',
  description: 'Mostrar el contacto del propietario',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ sock, m }) {
    if (!config.ownerNumbers.length) {
      await m.reply('⚠️ El propietario no ha configurado su número (OWNER_NUMBER).')
      return
    }

    const number = config.ownerNumbers[0]
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${config.ownerName}\n` +
      `ORG:${config.botName};\n` +
      `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n` +
      'END:VCARD'

    await sock.sendMessage(m.chat, {
      contacts: { displayName: config.ownerName, contacts: [{ vcard }] }
    }, { quoted: m.raw })

    await m.reply(`⛩️ *Propietario:* ${config.ownerName}\n📞 wa.me/${number}`)
  }
}
