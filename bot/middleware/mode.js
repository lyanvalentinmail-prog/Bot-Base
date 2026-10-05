/** Modo publico/privado y grupos silenciados. */
export default async function mode (ctx) {
  const { isOwner, settings, group, m } = ctx

  if (settings.mode === 'private' && !isOwner) return false

  // Grupo silenciado con .mute (solo admins y owner pueden usarlo)
  if (group?.mute && !isOwner && !ctx.isAdmin) return false

  // Nunca responder a mensajes de estado
  if (m.isStatus) return false

  return true
}
