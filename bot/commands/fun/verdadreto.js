/** Verdad o reto con preguntas y retos propios del bot. */
import { pickRandom } from '../../lib/functions.js'

const VERDADES = [
  '¿Cuál es el mayor secreto que le has ocultado a tu mejor amigo?',
  '¿Cuántas veces has mentido hoy?',
  '¿Cuál ha sido tu momento más vergonzoso en público?',
  '¿A quién de este grupo invitarías a un viaje y por qué?',
  '¿Qué aplicación escondes en una carpeta del móvil?',
  '¿Alguna vez te has hecho el dormido para evitar a alguien?',
  '¿Cuál es la última búsqueda rara de tu navegador?',
  '¿Qué canción escuchas en bucle y no admites en público?'
]

const RETOS = [
  'Envía un audio cantando el estribillo de la última canción que escuchaste.',
  'Cambia tu foto de perfil por un emoji durante 10 minutos.',
  'Escribe solo en mayúsculas durante los próximos 5 mensajes.',
  'Manda una captura de tu galería sin mirar (la última foto).',
  'Cuenta un chiste malo en nota de voz.',
  'Escribe un mensaje bonito a la última persona que te escribió.',
  'Pon de estado "me rindo" durante 15 minutos.',
  'Habla como un pirata durante los próximos 3 mensajes.'
]

export default {
  name: 'verdadreto',
  aliases: ['vor', 'truthordare', 'verdad', 'reto'],
  category: 'fun',
  args: '[verdad|reto]',
  description: 'Jugar a verdad o reto',
  example: 'verdadreto reto',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, args, commandName }) {
    const choice = (args[0] || commandName || '').toLowerCase()
    const wantsDare = choice.startsWith('reto') || choice.startsWith('dare')
    const wantsTruth = choice.startsWith('verdad') || choice.startsWith('truth')
    const dare = wantsDare || (!wantsTruth && Math.random() < 0.5)
    await m.reply(
      dare
        ? `🎯 *RETO*\n\n${pickRandom(RETOS)}`
        : `💬 *VERDAD*\n\n${pickRandom(VERDADES)}`
    )
  }
}
