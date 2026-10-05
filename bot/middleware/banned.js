/** Bloquea a los usuarios baneados (el owner nunca puede quedar bloqueado). */
export default async function banned (ctx) {
  const { user, isOwner } = ctx
  if (isOwner) return true
  if (!user.banned) return true
  // Silencio total: no se responde para no dar juego al spam.
  return false
}
