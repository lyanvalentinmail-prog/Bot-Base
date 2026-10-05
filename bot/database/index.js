/**
 * API de la base de datos: usuarios, grupos, ajustes, XP, limites, premium,
 * economia/RPG, baneos y comandos deshabilitados.
 */
import path from 'node:path'
import config from '../config.js'
import logger from '../lib/logger.js'
import { JsonStore } from './store.js'
import { dbSchema, userSchema, groupSchema, settingsSchema, applyDefaults } from './schema.js'

export const store = new JsonStore(path.join(config.paths.data, 'database.json'), dbSchema)

export async function initDatabase () {
  await store.load()
  // Migracion suave del documento completo.
  store.data = applyDefaults(store.data, dbSchema())
  store.data.settings = applyDefaults(store.data.settings, settingsSchema())
  store.markDirty()
  logger.info(
    { usuarios: Object.keys(store.data.users).length, grupos: Object.keys(store.data.groups).length },
    'base de datos lista'
  )
  return store.data
}

export const db = {
  get data () { return store.data },
  get users () { return store.data.users },
  get groups () { return store.data.groups },
  get settings () { return store.data.settings },
  save: (force) => store.save(force),
  markDirty: () => store.markDirty(),
  close: () => store.close()
}

/** Clave estable de usuario: el numero cuando existe, si no el jid normalizado. */
export function userKey (jid = '') {
  const clean = String(jid).split(':')[0].split('/')[0]
  if (clean.endsWith('@s.whatsapp.net') || clean.endsWith('@c.us')) return clean.split('@')[0]
  return clean
}

/* ─────────────── Usuarios ─────────────── */

export function getUser (jid, pushName = '') {
  const key = userKey(jid)
  const now = Date.now()
  if (!store.data.users[key]) {
    store.data.users[key] = { ...userSchema(), firstSeen: now }
    store.markDirty()
  }
  const user = applyDefaults(store.data.users[key], userSchema())
  user.id = key
  user.jid = key.includes('@') ? key : `${key}@s.whatsapp.net`
  if (pushName && user.name !== pushName) { user.name = pushName; store.markDirty() }
  user.lastSeen = now
  resetDailyLimit(user)
  checkPremiumExpiry(user)
  return user
}

export function getAllUsers () {
  return Object.entries(store.data.users).map(([id, value]) => ({ id, ...value }))
}

/* ─────────────── Grupos ─────────────── */

export function getGroup (jid, name = '') {
  if (!store.data.groups[jid]) {
    store.data.groups[jid] = { ...groupSchema(), joinedAt: Date.now() }
    store.markDirty()
  }
  const group = applyDefaults(store.data.groups[jid], groupSchema())
  group.id = jid
  if (name && group.name !== name) { group.name = name; store.markDirty() }
  group.lastActivity = Date.now()
  return group
}

/* ─────────────── Limites diarios ─────────────── */

/** Reinicia el limite si cambio el dia (UTC). */
export function resetDailyLimit (user) {
  const today = new Date().setUTCHours(0, 0, 0, 0)
  if (user.lastLimitReset < today) {
    user.limit = user.premium ? config.premiumLimit : config.defaultLimit
    user.lastLimitReset = today
    store.markDirty()
  }
  return user.limit
}

export function useLimit (user, amount = 1) {
  if (user.premium) return true
  if (user.limit < amount) return false
  user.limit -= amount
  store.markDirty()
  return true
}

export function addLimit (user, amount = 1) {
  user.limit += amount
  store.markDirty()
  return user.limit
}

/* ─────────────── Premium ─────────────── */

export function checkPremiumExpiry (user) {
  if (user.premium && user.premiumUntil && user.premiumUntil < Date.now()) {
    user.premium = false
    user.premiumUntil = 0
    store.markDirty()
  }
  return user.premium
}

export function setPremium (jid, days = 30) {
  const user = getUser(jid)
  const key = userKey(jid)
  const base = user.premiumUntil > Date.now() ? user.premiumUntil : Date.now()
  const until = base + days * 86_400_000
  store.data.users[key].premium = true
  store.data.users[key].premiumUntil = until
  store.data.users[key].limit = Math.max(store.data.users[key].limit, config.premiumLimit)
  if (!store.data.settings.premiumUsers.includes(key)) store.data.settings.premiumUsers.push(key)
  store.markDirty()
  return until
}

export function removePremium (jid) {
  const key = userKey(jid)
  const user = getUser(jid)
  user.premium = false
  user.premiumUntil = 0
  store.data.users[key].premium = false
  store.data.users[key].premiumUntil = 0
  store.data.settings.premiumUsers = store.data.settings.premiumUsers.filter((id) => id !== key)
  store.markDirty()
  return true
}

/* ─────────────── Baneos ─────────────── */

export function banUser (jid, reason = '') {
  const key = userKey(jid)
  const user = getUser(jid)
  user.banned = true
  user.banReason = reason
  store.data.users[key].banned = true
  store.data.users[key].banReason = reason
  if (!store.data.settings.bannedUsers.includes(key)) store.data.settings.bannedUsers.push(key)
  store.markDirty()
}

export function unbanUser (jid) {
  const key = userKey(jid)
  const user = getUser(jid)
  user.banned = false
  user.banReason = ''
  store.data.users[key].banned = false
  store.data.users[key].banReason = ''
  store.data.settings.bannedUsers = store.data.settings.bannedUsers.filter((id) => id !== key)
  store.markDirty()
}

/* ─────────────── Comandos deshabilitados ─────────────── */

export function disableCommand (name) {
  const list = store.data.settings.disabledCommands
  if (!list.includes(name)) list.push(name)
  store.markDirty()
}

export function enableCommand (name) {
  store.data.settings.disabledCommands = store.data.settings.disabledCommands.filter((c) => c !== name)
  store.markDirty()
}

export function isCommandDisabled (name, groupId = null) {
  if (store.data.settings.disabledCommands.includes(name)) return true
  if (groupId && store.data.groups[groupId]?.disabledCommands?.includes(name)) return true
  return false
}

/* ─────────────── Ajustes ─────────────── */

export function setSetting (key, value) {
  store.data.settings[key] = value
  store.markDirty()
  return value
}

export function getPrefix () {
  return store.data.settings.prefix || config.prefix
}

export function getMode () {
  return store.data.settings.mode || config.mode
}

/* ─────────────── Economia ─────────────── */

export function addMoney (user, amount) {
  user.money = Math.max(0, Math.round(user.money + amount))
  store.data.users[user.id].money = user.money
  store.markDirty()
  return user.money
}

export function addItem (user, item, amount = 1) {
  user.inventory[item] = (user.inventory[item] || 0) + amount
  if (user.inventory[item] < 0) user.inventory[item] = 0
  store.data.users[user.id].inventory = user.inventory
  store.markDirty()
  return user.inventory[item]
}

/* ─────────────── Estadisticas ─────────────── */

export function trackCommand (name, user) {
  store.data.stats.commands[name] = (store.data.stats.commands[name] || 0) + 1
  store.data.settings.totalCommands = (store.data.settings.totalCommands || 0) + 1
  if (user) {
    user.commands = (user.commands || 0) + 1
    store.data.users[user.id].commands = user.commands
  }
  store.markDirty()
}

export default db
