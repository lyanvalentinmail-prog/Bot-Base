/**
 * Botones y listas interactivas.
 *
 * WhatsApp no garantiza los mensajes interactivos en todas las versiones/clientes,
 * asi que SIEMPRE hay un respaldo en texto plano con los mismos comandos.
 * El id de cada boton es el comando real que se ejecutara al pulsarlo
 * (por ejemplo ".menu list"), de modo que botones y texto hacen lo mismo.
 */
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from 'baileys'
import logger from './logger.js'

/**
 * Si el servidor rechaza los interactivos se dejan de intentar durante un rato
 * (no para siempre: puede tratarse de un fallo puntual de WhatsApp).
 */
const RETRY_AFTER_MS = 30 * 60 * 1000
let interactiveDisabledUntil = 0

export const interactiveAvailable = () => Date.now() >= interactiveDisabledUntil

/**
 * Envia un mensaje con botones de respuesta rapida y/o una lista desplegable.
 *
 * @param {import('baileys').WASocket} sock
 * @param {string} jid
 * @param {object} options
 * @param {string} options.body Texto principal
 * @param {string} [options.footer]
 * @param {string} [options.title] Titulo de la cabecera
 * @param {Buffer} [options.image] Imagen de cabecera
 * @param {{id: string, text: string}[]} [options.buttons] Botones de respuesta rapida
 * @param {{title: string, rows: {id: string, title: string, description?: string}[]}[]} [options.sections] Lista
 * @param {string} [options.listTitle] Texto del boton que abre la lista
 * @param {string} [options.fallback] Texto alternativo (si no, se genera solo)
 * @param {object} [options.quoted] Mensaje citado
 */
export async function sendInteractive (sock, jid, options = {}) {
  const {
    body = '',
    footer = '',
    title = '',
    image = null,
    buttons = [],
    sections = [],
    listTitle = 'Ver opciones',
    quoted
  } = options

  const fallbackText = options.fallback ?? buildFallback({ body, footer, buttons, sections })

  if (interactiveAvailable() && (buttons.length || sections.length)) {
    try {
      const nativeButtons = []

      for (const button of buttons) {
        nativeButtons.push({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({ display_text: button.text, id: button.id })
        })
      }

      if (sections.length) {
        nativeButtons.push({
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: listTitle,
            sections: sections.map((section) => ({
              title: section.title,
              highlight_label: section.highlight || undefined,
              rows: section.rows.map((row) => ({
                header: row.header || '',
                title: row.title,
                description: row.description || '',
                id: row.id
              }))
            }))
          })
        })
      }

      const header = { title, subtitle: options.subtitle || '', hasMediaAttachment: false }
      if (image) {
        const media = await prepareWAMessageMedia({ image }, { upload: sock.waUploadToServer })
        Object.assign(header, media, { hasMediaAttachment: true })
      }

      const message = generateWAMessageFromContent(
        jid,
        {
          viewOnceMessage: {
            message: {
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({ text: body }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
                header: proto.Message.InteractiveMessage.Header.create(header),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: nativeButtons
                })
              })
            }
          }
        },
        { userJid: sock.user?.id, quoted }
      )

      await sock.relayMessage(jid, message.message, { messageId: message.key.id })
      return message
    } catch (error) {
      interactiveDisabledUntil = Date.now() + RETRY_AFTER_MS
      logger.warn(
        { err: error.message, reintentoEnMin: RETRY_AFTER_MS / 60000 },
        'mensajes interactivos no disponibles, se usará texto plano'
      )
    }
  }

  // ─── Respaldo en texto plano ───
  if (image) {
    return sock.sendMessage(jid, { image, caption: fallbackText }, { quoted })
  }
  return sock.sendMessage(jid, { text: fallbackText }, { quoted })
}

/** Genera el texto de respaldo listando las opciones como comandos escribibles. */
export function buildFallback ({ body = '', footer = '', buttons = [], sections = [] }) {
  const lines = [body]
  const options = []
  for (const button of buttons) options.push(`▸ ${button.text} ➜ *${button.id}*`)
  for (const section of sections) {
    if (section.title) options.push(`\n*${section.title}*`)
    for (const row of section.rows) options.push(`▸ ${row.title} ➜ *${row.id}*`)
  }
  if (options.length) lines.push('', '_Escribe la opción que quieras:_', options.join('\n'))
  if (footer) lines.push('', footer)
  return lines.join('\n').trim()
}

export default { sendInteractive, buildFallback, interactiveAvailable }
