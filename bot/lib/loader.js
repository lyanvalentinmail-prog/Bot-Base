/**
 * Cargador automatico de comandos (sistema de plugins).
 * Recorre bot/commands/<categoria>/*.js y registra cada modulo.
 * Un comando roto NUNCA impide que arranque el bot: se reporta y se omite.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import config from '../config.js'
import logger from './logger.js'
import { categoryOrder } from './categories.js'

/** Metadata por defecto de cualquier comando. */
const DEFAULTS = {
  aliases: [],
  args: '',
  description: 'Sin descripción',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  botAdmin: false,
  group: false,
  private: false,
  cooldown: null,
  hidden: false,
  register: false
}

export class CommandRegistry {
  constructor () {
    /** @type {Map<string, object>} */
    this.commands = new Map()
    /** @type {Map<string, string>} */
    this.aliases = new Map()
    /** @type {{ file: string, error: string }[]} */
    this.errors = []
    this.loadedAt = 0
  }

  get size () { return this.commands.size }

  /** Total de comandos visibles en el menu. */
  get total () { return [...this.commands.values()].filter((c) => !c.hidden).length }

  /** Resuelve por nombre o alias (sin distinguir mayusculas). */
  resolve (name) {
    const key = String(name || '').toLowerCase()
    if (this.commands.has(key)) return this.commands.get(key)
    const aliased = this.aliases.get(key)
    return aliased ? this.commands.get(aliased) : null
  }

  list () {
    return [...this.commands.values()]
  }

  /** @returns {Map<string, object[]>} comandos agrupados y ordenados por categoria. */
  byCategory (includeHidden = false) {
    const grouped = new Map()
    for (const command of this.commands.values()) {
      if (command.hidden && !includeHidden) continue
      if (!grouped.has(command.category)) grouped.set(command.category, [])
      grouped.get(command.category).push(command)
    }
    for (const list of grouped.values()) list.sort((a, b) => a.name.localeCompare(b.name))
    return new Map(
      [...grouped.entries()].sort((a, b) => categoryOrder(a[0]) - categoryOrder(b[0]) || a[0].localeCompare(b[0]))
    )
  }

  /** Carga (o recarga) todos los comandos desde disco. */
  async load ({ reload = false } = {}) {
    this.commands.clear()
    this.aliases.clear()
    this.errors = []

    const base = config.paths.commands
    const files = await walk(base)
    const stamp = reload ? `?t=${Date.now()}` : ''

    for (const file of files) {
      try {
        const module = await import(pathToFileURL(file).href + stamp)
        const command = module.default || module.command
        if (!command || typeof command !== 'object') {
          throw new Error('el módulo no exporta un objeto de comando por defecto')
        }
        const handler = command.exec || command.run || command.handler
        if (typeof handler !== 'function') throw new Error('falta la función exec()')

        const category = String(command.category || path.basename(path.dirname(file))).toLowerCase()
        const name = String(command.name || path.basename(file, '.js')).toLowerCase()

        const entry = {
          ...DEFAULTS,
          ...command,
          name,
          category,
          exec: handler,
          file,
          aliases: (command.aliases || []).map((a) => String(a).toLowerCase())
        }

        if (this.commands.has(entry.name)) {
          throw new Error(`nombre duplicado "${entry.name}" (ya definido en ${path.relative(base, this.commands.get(entry.name).file)})`)
        }

        this.commands.set(entry.name, entry)
        for (const alias of entry.aliases) {
          if (this.commands.has(alias) || this.aliases.has(alias)) {
            logger.warn({ alias, command: entry.name }, 'alias duplicado, se omite')
            continue
          }
          this.aliases.set(alias, entry.name)
        }
      } catch (error) {
        const relative = path.relative(config.paths.root, file)
        this.errors.push({ file: relative, error: error.message })
        logger.error({ file: relative, err: error.message }, 'no se pudo cargar el comando')
      }
    }

    this.loadedAt = Date.now()
    logger.info(
      { comandos: this.commands.size, alias: this.aliases.size, errores: this.errors.length },
      'comandos cargados'
    )
    return this
  }

  /** Recarga un unico archivo de comando (usado por el owner). */
  async reloadAll () {
    return this.load({ reload: true })
  }
}

/** Lista recursivamente los .js de un directorio. */
async function walk (dir) {
  const out = []
  let entries = []
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (error) {
    logger.error({ dir, err: error.message }, 'no se pudo leer la carpeta de comandos')
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) out.push(full)
  }
  return out.sort()
}

export const registry = new CommandRegistry()
export default registry
