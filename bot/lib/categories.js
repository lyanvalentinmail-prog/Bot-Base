/**
 * Categorias del menu: icono, nombre visible y orden.
 * El id debe coincidir con el nombre de la carpeta dentro de bot/commands/.
 */
export const CATEGORIES = [
  { id: 'main', icon: '◈', label: 'MAIN', description: 'Comandos principales' },
  { id: 'info', icon: 'ⓘ', label: 'INFO', description: 'Informacion del bot' },
  { id: 'fun', icon: '♢', label: 'FUN', description: 'Diversion y juegos rapidos' },
  { id: 'tools', icon: '⚒', label: 'TOOLS', description: 'Herramientas utiles' },
  { id: 'internet', icon: '◎', label: 'INTERNET', description: 'Consultas en linea' },
  { id: 'stalk', icon: '◉', label: 'STALK', description: 'Perfiles publicos' },
  { id: 'anime', icon: '✿', label: 'ANIME', description: 'Anime, manga y waifus' },
  { id: 'game', icon: '♟', label: 'GAME', description: 'Minijuegos' },
  { id: 'rpg', icon: '⚔', label: 'RPG', description: 'Economia y aventura' },
  { id: 'xp', icon: '★', label: 'XP', description: 'Niveles y ranking' },
  { id: 'ai', icon: '◇', label: 'AI', description: 'Inteligencia artificial' },
  { id: 'audio', icon: '♫', label: 'AUDIO', description: 'Conversion de audio' },
  { id: 'downloader', icon: '⇩', label: 'DOWNLOADER', description: 'Descargas publicas' },
  { id: 'image', icon: '▣', label: 'IMAGE', description: 'Edicion de imagenes' },
  { id: 'maker', icon: '✎', label: 'MAKER', description: 'Generadores creativos' },
  { id: 'panel', icon: '⚙', label: 'PANEL', description: 'Administracion de grupos' },
  { id: 'quotes', icon: '❝', label: 'QUOTES', description: 'Frases y citas' },
  { id: 'quran', icon: '۞', label: 'QURAN', description: 'Coran (Al Quran Cloud)' },
  { id: 'random', icon: '⟳', label: 'RANDOM', description: 'Contenido aleatorio' },
  { id: 'search', icon: '⌕', label: 'SEARCH', description: 'Buscadores' },
  { id: 'sound', icon: '♪', label: 'SOUND', description: 'Musica y sonidos' },
  { id: 'sticker', icon: '◩', label: 'STICKER', description: 'Stickers' },
  { id: 'store', icon: '♜', label: 'STORE', description: 'Tienda del bot' },
  { id: 'voice', icon: '♬', label: 'VOICE', description: 'Voz y efectos' },
  { id: 'owner', icon: '♛', label: 'OWNER', description: 'Solo propietario' }
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)

export function getCategory (id) {
  const key = String(id || '').toLowerCase()
  return CATEGORIES.find((c) => c.id === key || c.label.toLowerCase() === key) || null
}

/** Orden de una categoria (las desconocidas van al final). */
export function categoryOrder (id) {
  const index = CATEGORY_IDS.indexOf(String(id || '').toLowerCase())
  return index === -1 ? CATEGORIES.length : index
}

export default CATEGORIES
