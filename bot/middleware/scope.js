/** Restricciones de ambito: solo grupos / solo privado. */
export default async function scope (ctx) {
  const { command, m } = ctx

  if (command.group && !m.isGroup) {
    await m.reply('👥 Este comando solo funciona dentro de un *grupo*.')
    return false
  }

  if (command.private && m.isGroup) {
    await m.reply('🔒 Este comando solo funciona por *mensaje privado*.')
    return false
  }

  return true
}
