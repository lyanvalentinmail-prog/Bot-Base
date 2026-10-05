/**
 * Construccion del menu. Todo se genera dinamicamente a partir de los
 * comandos realmente registrados: ni la lista ni los totales estan escritos a mano.
 */
import config from '../config.js'
import smallcaps from './smallcaps.js'
import { CATEGORIES, getCategory } from './categories.js'
import { formatUptime } from './functions.js'

/** Simbolos de permisos. Los comandos publicos no llevan ninguno. */
export const BADGES = { premium: 'Ⓟ', limit: 'Ⓛ', owner: 'Ⓞ', admin: 'Ⓐ' }

export const BADGE_LEGEND = `${BADGES.premium} ${smallcaps('premium')}  ${BADGES.limit} ${smallcaps('limit')}  ${BADGES.owner} ${smallcaps('owner')}  ${BADGES.admin} ${smallcaps('admin')}`

/** Devuelve los simbolos que corresponden a un comando. */
export function badgesOf (command) {
  const out = []
  if (command.premium) out.push(BADGES.premium)
  if (command.limit) out.push(BADGES.limit)
  if (command.owner) out.push(BADGES.owner)
  if (command.admin) out.push(BADGES.admin)
  return out.join('')
}

/** Linea de uso real: ".weather <ciudad> Ⓛ" */
export function usageOf (command, prefix) {
  const badges = badgesOf(command)
  return `${prefix}${command.name}${command.args ? ` ${command.args}` : ''}${badges ? ` ${badges}` : ''}`
}

/** Linea del menu en small caps (solo presentacion). */
export function menuLine (command, prefix) {
  const badges = badgesOf(command)
  const args = command.args ? ` ${smallcaps(command.args)}` : ''
  return `┊ ✿ ${prefix}${smallcaps(command.name)}${args}${badges ? ` ${badges}` : ''}`
}

/* ─────────────── Menu principal ─────────────── */

export function buildMainMenu ({ userName, registry, prefix, mode, uptimeMs, status = 'Activo' }) {
  const total = registry.total
  const modeLabel = mode === 'private' ? 'Privado' : 'Público'
  return `¡Hola, *${userName}* 🎌
*${config.botName}* está listo para acompañarte durante el día 🎐
Aquí tienes todos mis comandos 👇


╭──( *${config.botName}*)
║🎌 Nombre del bot ☇ *${config.botName}*
│⛩️ Propietario ☇ *${config.ownerName}*
║🏮 Versión ☇ *${config.botVersion}*
│🍡 Modo ☇ *${modeLabel}*
║🎴 Estado ☇ *${status}*
│🎐 Tiempo activo ☇ *${formatUptime(uptimeMs)}*
║🍙 Usuario ☇ *${userName}*
│🎋 Prefijo ☇ *${prefix}*
║🗾 Total de comandos ☇ *${total}*
╰━━━━━━━━━━━━━━━━━━━⬣`
}

/* ─────────────── Bloque de una categoria ─────────────── */

/**
 * Bloque en el formato solicitado:
 *
 * ୨୧ ❏ ◇ ᴀɪ
 * ┊ ✿ .ᴄʜᴀᴛ <ᴍᴇɴꜱᴀᴊᴇ> Ⓛ
 * ୨୧
 */
export function buildCategoryBlock (categoryId, commands, prefix) {
  const category = getCategory(categoryId)
  const icon = category?.icon || '❏'
  const label = smallcaps(category?.label || categoryId)
  const lines = commands.map((command) => menuLine(command, prefix))
  return [`୨୧ ❏ ${icon} ${label}`, ...lines, '୨୧'].join('\n')
}

/** Menu de una sola categoria, con su total y la leyenda de permisos. */
export function buildCategoryMenu (registry, categoryId, prefix) {
  const grouped = registry.byCategory()
  const key = getCategory(categoryId)?.id || String(categoryId).toLowerCase()
  const commands = grouped.get(key)
  if (!commands?.length) return null
  return [
    buildCategoryBlock(key, commands, prefix),
    '',
    `${smallcaps('total')} : ${commands.length} ${smallcaps('fitur')}`,
    BADGE_LEGEND
  ].join('\n')
}

/** Listado completo: todas las categorias, una tras otra. */
export function buildFullMenu (registry, prefix) {
  const grouped = registry.byCategory()
  const blocks = []
  let total = 0
  for (const [categoryId, commands] of grouped) {
    blocks.push(buildCategoryBlock(categoryId, commands, prefix))
    total += commands.length
  }
  return [
    blocks.join('\n\n'),
    '',
    `${smallcaps('total')} : ${total} ${smallcaps('fitur')}`,
    BADGE_LEGEND
  ].join('\n')
}

/* ─────────────── Indice de categorias ─────────────── */

/** Indice de categorias en texto plano. */
export function buildCategoryListText (registry, prefix) {
  const grouped = registry.byCategory()
  const lines = [`╭─❏ *CATEGORÍAS* ❏`]
  for (const category of CATEGORIES) {
    const commands = grouped.get(category.id)
    if (!commands?.length) continue
    lines.push(`│ ${category.icon} *${prefix}menu ${category.id}* · ${commands.length}`)
  }
  for (const [categoryId, commands] of grouped) {
    if (CATEGORIES.some((c) => c.id === categoryId)) continue
    lines.push(`│ ❏ *${prefix}menu ${categoryId}* · ${commands.length}`)
  }
  lines.push('╰━━━━━━━━━━━━━━━⬣')
  lines.push('')
  lines.push(`_Usa_ *${prefix}menu <categoría>* _para ver sus comandos._`)
  lines.push(`_Usa_ *${prefix}commands* _para verlos todos._`)
  return lines.join('\n')
}

export default {
  buildMainMenu,
  buildCategoryMenu,
  buildFullMenu,
  buildCategoryListText,
  buildCategoryBlock,
  badgesOf,
  usageOf,
  BADGES,
  BADGE_LEGEND
}
