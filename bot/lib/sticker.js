/**
 * Creacion de stickers de WhatsApp: conversion a WebP + metadatos EXIF
 * (nombre del pack y autor) usando node-webpmux.
 */
import webpmux from 'node-webpmux'
import config from '../config.js'
import { imageToWebp, videoToWebp } from './ffmpeg.js'
import { UserError } from './errors.js'
import logger from './logger.js'

/**
 * Construye el bloque EXIF que WhatsApp lee para el pack/autor.
 * Formato: cabecera TIFF + un campo con el JSON de metadatos.
 */
function buildExif (packname, author, categories = ['']) {
  const json = {
    'sticker-pack-id': `com.bot.base.${Buffer.from(String(packname)).toString('hex').slice(0, 16)}`,
    'sticker-pack-name': String(packname ?? ''),
    'sticker-pack-publisher': String(author ?? ''),
    emojis: categories
  }
  const payload = Buffer.from(JSON.stringify(json), 'utf8')
  const header = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  header.writeUIntLE(payload.length, 14, 4)
  return Buffer.concat([header, payload])
}

/**
 * Añade/actualiza los metadatos EXIF de un WebP.
 * @param {Buffer} webpBuffer
 */
export async function addExif (webpBuffer, packname, author) {
  try {
    const image = new webpmux.Image()
    await image.load(webpBuffer)
    image.exif = buildExif(packname, author)
    return await image.save(null)
  } catch (error) {
    logger.warn({ err: error.message }, 'no se pudieron escribir los metadatos del sticker')
    throw new UserError('◩ No pude generar el sticker: el archivo convertido no es un WebP válido.\n_Comprueba que ffmpeg esté bien instalado._')
  }
}

/**
 * Convierte cualquier imagen/video/gif en un sticker WebP listo para enviar.
 * @param {Buffer} buffer
 * @param {{ mime?: string, ext?: string, packname?: string, author?: string, animated?: boolean }} options
 * @returns {Promise<Buffer>} WebP con EXIF
 */
export async function createSticker (buffer, options = {}) {
  const {
    mime = '',
    packname = config.botName,
    author = config.ownerName
  } = options

  const isAnimated = options.animated ?? /video|gif|webm|mp4/i.test(mime)
  const ext = options.ext || (isAnimated ? 'mp4' : 'jpg')

  let webp
  if (/webp/i.test(mime) && !options.forceConvert) {
    webp = buffer
  } else if (isAnimated) {
    webp = await videoToWebp(buffer, ext)
  } else {
    webp = await imageToWebp(buffer, ext)
  }

  return addExif(webp, packname, author)
}

export default { createSticker, addExif }
