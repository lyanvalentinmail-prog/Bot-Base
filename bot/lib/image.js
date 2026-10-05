/**
 * Utilidades de imagen con Jimp (JavaScript puro: funciona en Termux sin compilar).
 */
import { Jimp, loadFont, measureText, measureTextHeight, HorizontalAlign, VerticalAlign } from 'jimp'
import { SANS_16_WHITE, SANS_32_WHITE, SANS_64_WHITE, SANS_128_WHITE, SANS_32_BLACK, SANS_64_BLACK } from 'jimp/fonts'

export { Jimp }

const FONTS_WHITE = { 16: SANS_16_WHITE, 32: SANS_32_WHITE, 64: SANS_64_WHITE, 128: SANS_128_WHITE }
const FONTS_BLACK = { 32: SANS_32_BLACK, 64: SANS_64_BLACK }

const fontCache = new Map()

export async function getFont (size = 64, color = 'white') {
  const table = color === 'black' ? FONTS_BLACK : FONTS_WHITE
  const available = Object.keys(table).map(Number).sort((a, b) => a - b)
  const chosen = available.reduce((best, current) => (current <= size ? current : best), available[0])
  const key = `${color}-${chosen}`
  if (!fontCache.has(key)) fontCache.set(key, await loadFont(table[chosen]))
  return { font: fontCache.get(key), size: chosen }
}

export const read = (buffer) => Jimp.fromBuffer(buffer)

export const toPng = (image) => image.getBuffer('image/png')
export const toJpeg = (image) => image.getBuffer('image/jpeg')

/**
 * Dibuja texto centrado y ajustado dentro de un lienzo cuadrado transparente.
 * @param {string} text
 * @param {{ size?: number, canvas?: number, color?: 'white'|'black', tint?: number }} options
 * @returns {Promise<Buffer>} PNG
 */
export async function textToImage (text, options = {}) {
  const { canvas = 512, color = 'white', tint = null } = options
  const image = new Jimp({ width: canvas, height: canvas, color: 0x00000000 })

  // Se elige el mayor tamaño de fuente que quepa.
  const sizes = [128, 64, 32, 16]
  let picked = null
  for (const size of sizes) {
    const { font } = await getFont(size, color)
    const height = measureTextHeight(font, text, canvas - 40)
    const width = measureText(font, text)
    if (height <= canvas - 40 && (width <= canvas - 40 || height <= canvas - 40)) { picked = font; break }
  }
  if (!picked) picked = (await getFont(16, color)).font

  image.print({
    font: picked,
    x: 20,
    y: 20,
    text: { text, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE },
    maxWidth: canvas - 40,
    maxHeight: canvas - 40
  })

  if (tint !== null) {
    // Tinta el texto blanco con un color (se respeta la transparencia).
    const r = (tint >> 16) & 0xff
    const g = (tint >> 8) & 0xff
    const b = tint & 0xff
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, index) => {
      const alpha = image.bitmap.data[index + 3]
      if (alpha === 0) return
      image.bitmap.data[index] = r
      image.bitmap.data[index + 1] = g
      image.bitmap.data[index + 2] = b
    })
  }

  return image.getBuffer('image/png')
}

export default { Jimp, read, toPng, toJpeg, textToImage, getFont }
