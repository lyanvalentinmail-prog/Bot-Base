#!/usr/bin/env node
/**
 * Lanzador. Comprueba que las dependencias estén instaladas antes de cargar
 * el bot (así, si falta `npm install`, se ve un mensaje claro en vez de un
 * "Cannot find package ...") y después arranca el bot.
 */
import { ensureDependencies } from './lib/preflight.js'

ensureDependencies('npm start')

await import('./start.js')
