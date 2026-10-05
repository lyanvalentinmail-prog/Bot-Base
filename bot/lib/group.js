/**
 * Utilidades de grupo: metadatos cacheados y comprobacion de administradores.
 */
import NodeCache from 'node-cache'
import { jidNormalizedUser } from 'baileys'
import logger from './logger.js'

const metadataCache = new NodeCache({ stdTTL: 120, checkperiod: 60, useClones: false })

/** Metadatos del grupo con cache de 2 minutos (evita rate-limits). */
export async function getMetadata (sock, jid, force = false) {
  if (!jid?.endsWith('@g.us')) return null
  if (!force) {
    const cached = metadataCache.get(jid)
    if (cached) return cached
  }
  try {
    const metadata = await sock.groupMetadata(jid)
    metadataCache.set(jid, metadata)
    return metadata
  } catch (error) {
    logger.warn({ jid, err: error.message }, 'no se pudieron obtener los metadatos del grupo')
    return null
  }
}

export function invalidate (jid) {
  metadataCache.del(jid)
}

/** Lista de jids administradores a partir de los metadatos. */
export function adminsOf (metadata) {
  if (!metadata?.participants) return []
  return metadata.participants
    .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
    .map((p) => jidNormalizedUser(p.id))
}

export function isAdmin (metadata, jid) {
  return adminsOf(metadata).includes(jidNormalizedUser(jid))
}

export default { getMetadata, adminsOf, isAdmin, invalidate }
