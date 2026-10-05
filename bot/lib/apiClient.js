/**
 * Cliente HTTP centralizado + integraciones con APIs externas reales.
 *
 * Reglas:
 *  - Ninguna clave vive en el codigo: todas salen de config.keys (.env).
 *  - Si falta una clave se lanza MissingKeyError y el usuario ve
 *    "⚠️ Este servicio no está configurado."
 *  - Solo se usan endpoints oficiales/documentados.
 */
import axios from 'axios'
import config from '../config.js'
import logger, { sanitize } from './logger.js'
import { ApiError, MissingKeyError } from './errors.js'

const USER_AGENT = `Mozilla/5.0 (compatible; ${config.botName}/${config.botVersion}; +https://github.com)`

export const http = axios.create({
  timeout: 45_000,
  maxRedirects: 5,
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/plain, */*' },
  validateStatus: (status) => status >= 200 && status < 400
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = sanitize(error?.config?.url || '')
    logger.warn({ url, status: error?.response?.status, err: sanitize(error?.message) }, 'fallo peticion HTTP')
    return Promise.reject(error)
  }
)

/** Extrae un detalle corto y seguro del error para mostrarlo al usuario. */
function detailOf (error) {
  const status = error?.response?.status
  const data = error?.response?.data
  const apiMessage =
    (typeof data === 'object' && (data?.error?.message || data?.message || data?.errors?.[0]?.title)) || ''
  if (status && apiMessage) return `HTTP ${status}: ${sanitize(String(apiMessage)).slice(0, 180)}`
  if (status) return `HTTP ${status}`
  if (error?.code === 'ECONNABORTED') return 'tiempo de espera agotado'
  return sanitize(error?.message || '').slice(0, 180)
}

/* ─────────────── Helpers genericos ─────────────── */

export async function apiGet (url, options = {}, serviceName = 'API') {
  try {
    const { data } = await http.get(url, options)
    return data
  } catch (error) {
    throw new ApiError(serviceName, detailOf(error))
  }
}

export async function apiPost (url, body, options = {}, serviceName = 'API') {
  try {
    const { data } = await http.post(url, body, options)
    return data
  } catch (error) {
    throw new ApiError(serviceName, detailOf(error))
  }
}

/** Descarga cualquier recurso como Buffer. */
export async function fetchBuffer (url, options = {}, serviceName = 'descarga') {
  try {
    const response = await http.get(url, { ...options, responseType: 'arraybuffer' })
    return {
      buffer: Buffer.from(response.data),
      contentType: String(response.headers['content-type'] || '').split(';')[0],
      contentLength: Number(response.headers['content-length'] || response.data?.byteLength || 0)
    }
  } catch (error) {
    throw new ApiError(serviceName, detailOf(error))
  }
}

/** Lanza MissingKeyError si la clave indicada no esta configurada. */
export function requireKey (name, envName) {
  const value = config.keys[name]
  if (!value) throw new MissingKeyError(envName)
  return value
}

export const hasKey = (name) => Boolean(config.keys[name])

/* ─────────────── OpenAI (https://platform.openai.com/docs) ─────────────── */

export const openai = {
  available: () => hasKey('openai'),

  /** Chat Completions API */
  async chat (messages, { model = config.models.openaiChat, temperature = 0.7, maxTokens = 900 } = {}) {
    const key = requireKey('openai', 'OPENAI_API_KEY')
    const data = await apiPost(
      'https://api.openai.com/v1/chat/completions',
      { model, messages, temperature, max_tokens: maxTokens },
      { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } },
      'OpenAI'
    )
    const text = data?.choices?.[0]?.message?.content?.trim()
    if (!text) throw new ApiError('OpenAI', 'respuesta vacía')
    return text
  },

  /** Images API -> Buffer PNG */
  async image (prompt, { model = config.models.openaiImage, size = '1024x1024' } = {}) {
    const key = requireKey('openai', 'OPENAI_API_KEY')
    const data = await apiPost(
      'https://api.openai.com/v1/images/generations',
      { model, prompt, n: 1, size },
      { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 180_000 },
      'OpenAI Images'
    )
    const item = data?.data?.[0]
    if (item?.b64_json) return Buffer.from(item.b64_json, 'base64')
    if (item?.url) return (await fetchBuffer(item.url, {}, 'OpenAI Images')).buffer
    throw new ApiError('OpenAI Images', 'sin imagen en la respuesta')
  },

  /** Text-to-Speech API -> Buffer MP3 */
  async speech (text, { model = config.models.openaiTts, voice = 'alloy' } = {}) {
    const key = requireKey('openai', 'OPENAI_API_KEY')
    try {
      const response = await http.post(
        'https://api.openai.com/v1/audio/speech',
        { model, voice, input: text, response_format: 'mp3' },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          responseType: 'arraybuffer',
          timeout: 120_000
        }
      )
      return Buffer.from(response.data)
    } catch (error) {
      throw new ApiError('OpenAI TTS', detailOf(error))
    }
  }
}

/* ─────────────── Google Gemini (https://ai.google.dev/api) ─────────────── */

export const gemini = {
  available: () => hasKey('gemini'),

  async generate (prompt, { model = config.models.gemini, system = '', images = [] } = {}) {
    const key = requireKey('gemini', 'GEMINI_API_KEY')
    const parts = [{ text: prompt }]
    for (const image of images) {
      parts.push({ inline_data: { mime_type: image.mime || 'image/jpeg', data: image.buffer.toString('base64') } })
    }
    const body = { contents: [{ role: 'user', parts }] }
    if (system) body.system_instruction = { parts: [{ text: system }] }

    const data = await apiPost(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      body,
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, timeout: 90_000 },
      'Gemini'
    )
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n').trim()
    if (!text) throw new ApiError('Gemini', 'respuesta vacía o bloqueada por filtros de seguridad')
    return text
  }
}

/* ─────────────── OpenWeatherMap (https://openweathermap.org/api) ─────────────── */

export const weather = {
  available: () => hasKey('weather'),

  async current (city) {
    const key = requireKey('weather', 'WEATHER_API_KEY')
    return apiGet(
      'https://api.openweathermap.org/data/2.5/weather',
      { params: { q: city, appid: key, units: 'metric', lang: 'es' } },
      'OpenWeatherMap'
    )
  },

  async forecast (city) {
    const key = requireKey('weather', 'WEATHER_API_KEY')
    return apiGet(
      'https://api.openweathermap.org/data/2.5/forecast',
      { params: { q: city, appid: key, units: 'metric', lang: 'es', cnt: 8 } },
      'OpenWeatherMap'
    )
  }
}

/* ─────────────── remove.bg (https://www.remove.bg/api) ─────────────── */

export const removebg = {
  available: () => hasKey('removebg'),

  /** @param {Buffer} buffer imagen de entrada @returns {Promise<Buffer>} PNG sin fondo */
  async remove (buffer, size = 'auto') {
    const key = requireKey('removebg', 'REMOVE_BG_API_KEY')
    const form = new FormData()
    form.append('image_file', new Blob([buffer]), 'image.png')
    form.append('size', size)
    try {
      const response = await http.post('https://api.remove.bg/v1.0/removebg', form, {
        headers: { 'X-Api-Key': key },
        responseType: 'arraybuffer',
        timeout: 120_000
      })
      return Buffer.from(response.data)
    } catch (error) {
      throw new ApiError('remove.bg', detailOf(error))
    }
  }
}

/** Estado de las integraciones que dependen de una clave. */
export function servicesStatus () {
  return [
    { name: 'OpenAI', env: 'OPENAI_API_KEY', ready: hasKey('openai') },
    { name: 'Gemini', env: 'GEMINI_API_KEY', ready: hasKey('gemini') },
    { name: 'OpenWeatherMap', env: 'WEATHER_API_KEY', ready: hasKey('weather') },
    { name: 'remove.bg', env: 'REMOVE_BG_API_KEY', ready: hasKey('removebg') }
  ]
}

export default { http, apiGet, apiPost, fetchBuffer, openai, gemini, weather, removebg, requireKey, hasKey, servicesStatus }
