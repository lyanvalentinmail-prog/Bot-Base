/**
 * Cadena de middlewares previa a la ejecucion de un comando.
 * Cada middleware recibe el contexto y devuelve true (continuar) o false (bloquear).
 * El propio middleware se encarga de responder al usuario cuando bloquea.
 *
 * Mantener esta cadena separada evita un handler gigantesco.
 */
import banned from './banned.js'
import mode from './mode.js'
import disabled from './disabled.js'
import scope from './scope.js'
import permissions from './permissions.js'
import args from './args.js'
import cooldown from './cooldown.js'
import limit from './limit.js'

/** El orden importa: de lo mas barato/restrictivo a lo mas costoso. */
export const chain = [banned, mode, disabled, scope, permissions, args, cooldown, limit]

/**
 * @param {object} ctx
 * @returns {Promise<boolean>} true si el comando puede ejecutarse
 */
export async function runMiddlewares (ctx) {
  for (const middleware of chain) {
    const allowed = await middleware(ctx)
    if (!allowed) return false
  }
  return true
}

export default runMiddlewares
