/** Recarga todos los comandos sin reiniciar el proceso. */
export default {
  name: 'reload',
  aliases: ['recargar'],
  category: 'owner',
  args: '',
  description: 'Recargar los comandos desde disco',
  limit: false,
  premium: false,
  owner: true,
  admin: false,

  async exec ({ m, registry }) {
    const before = registry.size
    await registry.reloadAll()
    const errors = registry.errors

    await m.reply(
      `♻️ *Comandos recargados*\n\n` +
      `📦 Antes ☇ ${before}\n📦 Ahora ☇ ${registry.size}\n` +
      (errors.length
        ? `\n⚠️ Con errores (${errors.length}):\n${errors.map((e) => `• ${e.file}: ${e.error}`).join('\n')}`
        : '\n✅ Sin errores.')
    )
  }
}
