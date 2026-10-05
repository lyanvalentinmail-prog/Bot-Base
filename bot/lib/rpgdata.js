/**
 * Datos del sistema de economia/RPG: objetos, precios y tablas de recompensas.
 */

/** Objetos de la tienda y del inventario. */
export const ITEMS = {
  potion: { name: 'Poción', emoji: '🧪', buy: 120, sell: 60, description: 'Recupera 50 de salud' },
  sword: { name: 'Espada', emoji: '⚔️', buy: 1500, sell: 700, description: 'Mejora la caza' },
  pickaxe: { name: 'Pico', emoji: '⛏️', buy: 1200, sell: 550, description: 'Mejora la minería' },
  armor: { name: 'Armadura', emoji: '🛡️', buy: 2000, sell: 900, description: 'Reduce el daño recibido' },
  wood: { name: 'Madera', emoji: '🪵', buy: 40, sell: 18, description: 'Material básico' },
  stone: { name: 'Piedra', emoji: '🪨', buy: 50, sell: 22, description: 'Material básico' },
  iron: { name: 'Hierro', emoji: '⛓️', buy: 160, sell: 80, description: 'Material común' },
  gold: { name: 'Oro', emoji: '🥇', buy: 420, sell: 210, description: 'Material valioso' },
  diamond: { name: 'Diamante', emoji: '💎', buy: 1100, sell: 560, description: 'Material raro' },
  emerald: { name: 'Esmeralda', emoji: '💚', buy: 1600, sell: 820, description: 'Material muy raro' },
  fish: { name: 'Pescado', emoji: '🐟', buy: 70, sell: 35, description: 'Comida' },
  meat: { name: 'Carne', emoji: '🍖', buy: 90, sell: 45, description: 'Comida' }
}

/** Probabilidades de la mina: [item, peso, cantidadMax] */
export const MINE_TABLE = [
  ['stone', 40, 4], ['wood', 22, 3], ['iron', 20, 3],
  ['gold', 10, 2], ['diamond', 6, 1], ['emerald', 2, 1]
]

/** Botín de la caza. */
export const HUNT_TABLE = [
  ['meat', 45, 3], ['fish', 30, 3], ['wood', 15, 2], ['gold', 7, 1], ['diamond', 3, 1]
]

export const WORK_JOBS = [
  { name: 'repartidor de comida', min: 90, max: 260 },
  { name: 'programador freelance', min: 180, max: 520 },
  { name: 'camarero', min: 80, max: 230 },
  { name: 'diseñador gráfico', min: 150, max: 430 },
  { name: 'taxista', min: 110, max: 320 },
  { name: 'profesor particular', min: 140, max: 380 },
  { name: 'community manager', min: 130, max: 360 },
  { name: 'mecánico', min: 120, max: 340 }
]

export const ADVENTURE_EVENTS = [
  { text: 'Encontraste un cofre escondido tras una cascada', money: [200, 600], health: 0 },
  { text: 'Te emboscaron unos bandidos, pero lograste escapar', money: [0, 80], health: -25 },
  { text: 'Ayudaste a un mercader y te recompensó', money: [150, 450], health: 0 },
  { text: 'Caíste en una trampa del bosque', money: [0, 0], health: -35 },
  { text: 'Derrotaste a un lobo gigante', money: [250, 700], health: -15 },
  { text: 'Descubriste unas ruinas antiguas llenas de monedas', money: [300, 900], health: -10 },
  { text: 'Pasaste la noche en una posada y recuperaste fuerzas', money: [-80, -20], health: 25 }
]

/** Tiempos de espera en milisegundos. */
export const COOLDOWNS = {
  daily: 24 * 60 * 60 * 1000,
  work: 15 * 60 * 1000,
  mine: 10 * 60 * 1000,
  hunt: 12 * 60 * 1000,
  adventure: 30 * 60 * 1000,
  rob: 60 * 60 * 1000
}

/** Elige una entrada de una tabla ponderada. */
export function rollTable (table) {
  const total = table.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [item, weight, maxAmount] of table) {
    roll -= weight
    if (roll <= 0) return { item, amount: 1 + Math.floor(Math.random() * maxAmount) }
  }
  const [item, , maxAmount] = table[0]
  return { item, amount: 1 + Math.floor(Math.random() * maxAmount) }
}

export const itemLabel = (key) => (ITEMS[key] ? `${ITEMS[key].emoji} ${ITEMS[key].name}` : key)

export default { ITEMS, MINE_TABLE, HUNT_TABLE, WORK_JOBS, ADVENTURE_EVENTS, COOLDOWNS, rollTable, itemLabel }
