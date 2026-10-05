/**
 * Serializador de mensajes: convierte el objeto crudo de Baileys en un
 * objeto `m` comodo y uniforme para todos los comandos.
 */
import { downloadMediaMessage, getContentType, jidNormalizedUser } from 'baileys'
import { waLogger } from './logger.js'

/** Quita las envolturas (ephemeral, viewOnce, documentWithCaption...). */
export function unwrapMessage (message) {
  let content = message
  let guard = 0
  while (content && guard++ < 5) {
    const type = getContentType(content)
    if (type === 'ephemeralMessage') { content = content.ephemeralMessage.message; continue }
    if (type === 'viewOnceMessage') { content = content.viewOnceMessage.message; continue }
    if (type === 'viewOnceMessageV2') { content = content.viewOnceMessageV2.message; continue }
    if (type === 'viewOnceMessageV2Extension') { content = content.viewOnceMessageV2Extension.message; continue }
    if (type === 'documentWithCaptionMessage') { content = content.documentWithCaptionMessage.message; continue }
    if (type === 'editedMessage') { content = content.editedMessage.message; continue }
    break
  }
  return content || message
}

/** Texto plano de cualquier tipo de mensaje. */
export function extractText (message) {
  if (!message) return ''
  const type = getContentType(message)
  const content = message[type]
  switch (type) {
    case 'conversation': return content || ''
    case 'extendedTextMessage': return content?.text || ''
    case 'imageMessage':
    case 'videoMessage':
    case 'documentMessage': return content?.caption || ''
    case 'buttonsResponseMessage': return content?.selectedDisplayText || content?.selectedButtonId || ''
    case 'templateButtonReplyMessage': return content?.selectedDisplayText || content?.selectedId || ''
    case 'listResponseMessage': return content?.title || content?.singleSelectReply?.selectedRowId || ''
    case 'interactiveResponseMessage': {
      try {
        const params = JSON.parse(content?.nativeFlowResponseMessage?.paramsJson || '{}')
        return params.id || params.command || ''
      } catch { return '' }
    }
    case 'reactionMessage': return content?.text || ''
    default: return content?.text || content?.caption || ''
  }
}

/**
 * Id devuelto al pulsar un boton / fila de lista.
 * Permite que los botones ejecuten comandos reales.
 */
export function extractButtonId (message) {
  if (!message) return null
  const type = getContentType(message)
  const content = message[type]
  if (type === 'buttonsResponseMessage') return content?.selectedButtonId || null
  if (type === 'templateButtonReplyMessage') return content?.selectedId || null
  if (type === 'listResponseMessage') return content?.singleSelectReply?.selectedRowId || null
  if (type === 'interactiveResponseMessage') {
    try {
      const params = JSON.parse(content?.nativeFlowResponseMessage?.paramsJson || '{}')
      return params.id || null
    } catch { return null }
  }
  return null
}

const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']

/**
 * @param {import('baileys').WASocket} sock
 * @param {import('baileys').proto.IWebMessageInfo} raw
 */
export function serialize (sock, raw) {
  if (!raw?.message) return null

  const m = {}
  m.raw = raw
  m.key = raw.key
  m.id = raw.key.id
  m.chat = jidNormalizedUser(raw.key.remoteJid || '')
  m.isGroup = m.chat.endsWith('@g.us')
  m.fromMe = Boolean(raw.key.fromMe)
  m.isStatus = m.chat === 'status@broadcast'
  m.pushName = raw.pushName || ''
  m.timestamp = Number(raw.messageTimestamp?.low || raw.messageTimestamp || Date.now() / 1000) * 1000

  const botJid = jidNormalizedUser(sock.user?.id || '')
  m.sender = jidNormalizedUser(
    m.isGroup ? (raw.key.participant || raw.participant || '') : (m.fromMe ? botJid : m.chat)
  ) || botJid
  m.senderNumber = m.sender.split('@')[0]
  m.botJid = botJid
  m.botNumber = botJid.split('@')[0]

  m.message = unwrapMessage(raw.message)
  m.type = getContentType(m.message) || 'unknown'
  m.msg = m.message?.[m.type]
  m.body = extractText(m.message)
  m.text = m.body
  m.buttonId = extractButtonId(m.message)

  const context = m.msg?.contextInfo || m.message?.extendedTextMessage?.contextInfo || null
  m.mentionedJid = (context?.mentionedJid || []).map((jid) => jidNormalizedUser(jid))
  m.isMedia = MEDIA_TYPES.includes(m.type)
  m.mime = m.msg?.mimetype || ''
  m.isViewOnce = Boolean(m.msg?.viewOnce)

  /* ─── Mensaje citado ─── */
  m.quoted = null
  if (context?.quotedMessage) {
    const quotedMessage = unwrapMessage(context.quotedMessage)
    const quotedType = getContentType(quotedMessage) || 'unknown'
    const participant = jidNormalizedUser(context.participant || '')
    const quotedKey = {
      remoteJid: m.chat,
      fromMe: participant === botJid,
      id: context.stanzaId,
      participant: m.isGroup ? participant : undefined
    }
    const quotedRaw = { key: quotedKey, message: context.quotedMessage }
    m.quoted = {
      key: quotedKey,
      raw: quotedRaw,
      message: quotedMessage,
      type: quotedType,
      msg: quotedMessage?.[quotedType],
      sender: participant,
      senderNumber: participant.split('@')[0],
      fromMe: quotedKey.fromMe,
      text: extractText(quotedMessage),
      mime: quotedMessage?.[quotedType]?.mimetype || '',
      isMedia: MEDIA_TYPES.includes(quotedType),
      download: () => downloadMediaMessage(quotedRaw, 'buffer', {}, {
        logger: waLogger,
        reuploadRequest: sock.updateMediaMessage
      })
    }
  }

  /* ─── Atajos ─── */
  m.reply = (content, options = {}) => {
    const payload = typeof content === 'string' ? { text: content } : { ...content }
    // Comodidad: permitir m.reply(texto, { mentions }) sin construir el payload.
    const { mentions, contextInfo, ...sendOptions } = options
    if (mentions) payload.mentions = mentions
    if (contextInfo) payload.contextInfo = { ...(payload.contextInfo || {}), ...contextInfo }
    return sock.sendMessage(m.chat, payload, { quoted: raw, ...sendOptions })
  }

  m.send = (jid, content, options = {}) => {
    const payload = typeof content === 'string' ? { text: content } : content
    return sock.sendMessage(jid, payload, options)
  }

  m.react = (emoji) => sock.sendMessage(m.chat, { react: { text: emoji, key: raw.key } }).catch(() => {})

  m.download = () => downloadMediaMessage(raw, 'buffer', {}, {
    logger: waLogger,
    reuploadRequest: sock.updateMediaMessage
  })

  /** Descarga el medio del mensaje actual o del citado (lo que exista). */
  m.downloadAny = async () => {
    if (m.isMedia) return m.download()
    if (m.quoted?.isMedia) return m.quoted.download()
    return null
  }

  /** Mime del medio disponible (actual o citado). */
  m.anyMime = m.isMedia ? m.mime : (m.quoted?.isMedia ? m.quoted.mime : '')

  return m
}

export default serialize
