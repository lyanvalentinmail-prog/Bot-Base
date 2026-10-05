/**
 * Validacion automatica de argumentos.
 *   <argumento> = obligatorio
 *   [argumento] = opcional
 * Si faltan obligatorios se muestra el uso correcto y no se ejecuta el comando.
 */
import { usageOf } from '../lib/menu.js'

/** Extrae los argumentos obligatorios de la cadena de metadata. */
export function requiredArgs (argsSpec = '') {
  return [...String(argsSpec).matchAll(/<([^>]+)>/g)].map((match) => match[1].trim())
}

export default async function argsMiddleware (ctx) {
  const { command, args, m, prefix, text } = ctx
  const required = requiredArgs(command.args)
  if (!required.length) return true

  // Un medio citado/adjunto puede sustituir al argumento (stickers, imagenes, audio...).
  if (command.mediaArg && (m.isMedia || m.quoted?.isMedia)) return true
  // Una mencion o una respuesta puede cubrir <@usuario>
  if (/^@/.test(required[0]) || /usuario|user|miembro/i.test(required[0])) {
    if (m.mentionedJid.length || m.quoted) return true
  }

  const provided = args.filter(Boolean).length
  if (provided >= required.length) return true
  // Si solo falta el ultimo obligatorio pero hay texto libre, se acepta.
  if (required.length === 1 && text.trim().length > 0) return true

  const faltan = required.slice(provided).map((a) => `<${a}>`).join(' ')
  await m.reply(
    `📌 Faltan argumentos: *${faltan}*\n\n` +
    `✏️ *Uso:* ${usageOf(command, prefix)}\n` +
    (command.example ? `💡 *Ejemplo:* ${prefix}${command.example}\n` : '') +
    `\n_<> obligatorio · [] opcional_`
  )
  return false
}
