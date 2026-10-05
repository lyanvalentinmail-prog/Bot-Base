/**
 * Permisos reales: Ⓞ owner, Ⓐ admin, Ⓟ premium (y admin del bot en el grupo).
 * El owner se identifica EXCLUSIVAMENTE mediante OWNER_NUMBER del .env.
 */
export default async function permissions (ctx) {
  const { command, m, user, isOwner, isAdmin, isBotAdmin } = ctx

  if (command.owner && !isOwner) {
    await m.reply('Ⓞ Este comando es exclusivo del *propietario* del bot.')
    return false
  }

  if (command.admin && !isAdmin && !isOwner) {
    await m.reply('Ⓐ Necesitas ser *administrador del grupo* para usar este comando.')
    return false
  }

  if (command.botAdmin && !isBotAdmin) {
    await m.reply('🤖 Necesito ser *administrador del grupo* para poder hacer eso.')
    return false
  }

  if (command.premium && !user.premium && !isOwner) {
    await m.reply(
      'Ⓟ Este comando es solo para usuarios *premium*.\n\n' +
      'Pide acceso al propietario del bot para desbloquearlo.'
    )
    return false
  }

  return true
}
