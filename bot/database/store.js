/**
 * Almacen JSON persistente con escritura atomica, autosave con debounce
 * y copia de seguridad ante archivos corruptos.
 * Sin dependencias nativas: funciona igual en Termux (Android) y en un VPS.
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import logger from '../lib/logger.js'

export class JsonStore {
  /**
   * @param {string} file Ruta del archivo .json
   * @param {() => object} defaultsFactory Genera el documento por defecto
   * @param {{ autosaveMs?: number, debounceMs?: number }} [options]
   */
  constructor (file, defaultsFactory, options = {}) {
    this.file = file
    this.defaultsFactory = defaultsFactory
    this.data = defaultsFactory()
    this.autosaveMs = options.autosaveMs ?? 60_000
    this.debounceMs = options.debounceMs ?? 2_000
    this._dirty = false
    this._saving = null
    this._timer = null
    this._interval = null
  }

  async load () {
    await fsp.mkdir(path.dirname(this.file), { recursive: true })
    try {
      const raw = await fsp.readFile(this.file, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') this.data = parsed
      logger.debug({ file: path.basename(this.file) }, 'base de datos cargada')
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.data = this.defaultsFactory()
        await this.save(true)
        logger.info({ file: path.basename(this.file) }, 'base de datos creada')
      } else {
        // Archivo corrupto: se respalda y se empieza de cero para no tumbar el bot.
        const backup = `${this.file}.corrupt-${Date.now()}.bak`
        await fsp.rename(this.file, backup).catch(() => {})
        this.data = this.defaultsFactory()
        await this.save(true)
        logger.error({ err: error.message, backup }, 'base de datos corrupta, se creo una nueva')
      }
    }
    this._interval = setInterval(() => { if (this._dirty) this.save().catch(() => {}) }, this.autosaveMs)
    this._interval.unref?.()
    return this.data
  }

  /** Marca cambios pendientes y programa el guardado. */
  markDirty () {
    this._dirty = true
    if (this._timer) return
    this._timer = setTimeout(() => {
      this._timer = null
      this.save().catch((error) => logger.error({ err: error.message }, 'fallo al guardar la base de datos'))
    }, this.debounceMs)
    this._timer.unref?.()
  }

  /** Escritura atomica: se escribe un .tmp y se renombra. */
  async save (force = false) {
    if (!this._dirty && !force) return
    if (this._saving) return this._saving
    this._dirty = false
    const tmp = `${this.file}.tmp`
    this._saving = (async () => {
      try {
        await fsp.mkdir(path.dirname(this.file), { recursive: true })
        await fsp.writeFile(tmp, JSON.stringify(this.data, null, 2))
        await fsp.rename(tmp, this.file)
      } finally {
        this._saving = null
      }
    })()
    return this._saving
  }

  /** Guardado sincrono, util dentro de los manejadores de salida del proceso. */
  saveSync () {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      const tmp = `${this.file}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2))
      fs.renameSync(tmp, this.file)
      this._dirty = false
    } catch (error) {
      logger.error({ err: error.message }, 'fallo al guardar la base de datos (sync)')
    }
  }

  close () {
    if (this._interval) clearInterval(this._interval)
    if (this._timer) clearTimeout(this._timer)
    this.saveSync()
  }
}

export default JsonStore
