/**
 * Conversion a "small caps" SOLO para la presentacion del menu.
 * Los comandos reales siguen siendo .chat, .ping, etc.
 */
const MAP = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ',
  s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
  á: 'ᴀ', é: 'ᴇ', í: 'ɪ', ó: 'ᴏ', ú: 'ᴜ', ñ: 'ɴ', ü: 'ᴜ'
}

/**
 * @param {string} text
 * @returns {string} texto en small caps (numeros y simbolos se conservan)
 */
export function smallcaps (text) {
  return String(text ?? '')
    .split('')
    .map((char) => MAP[char.toLowerCase()] ?? char)
    .join('')
}

export default smallcaps
