<div align="center">

# 🤖 Bot-Base

**Bot de WhatsApp modular, en español, hecho con Node.js 20+ y [Baileys](https://github.com/WhiskeySockets/Baileys).**

Vinculación por **Pairing Code** · sistema de **plugins** · permisos reales · XP/niveles · economía/RPG
· base de datos persistente · stickers y multimedia con FFmpeg · APIs externas opcionales.

Funciona en **Termux (Android)** y en **Linux/VPS**.

</div>

---

## 📑 Índice

1. [Características](#-características)
2. [Instalación en Termux](#-instalación-en-termux)
3. [Instalación en Linux / VPS](#-instalación-en-linux--vps)
4. [Vinculación con Pairing Code](#-vinculación-con-pairing-code)
5. [Configuración (.env)](#-configuración-env)
6. [Scripts de npm](#-scripts-de-npm)
7. [Comandos](#-comandos)
8. [Permisos y argumentos](#-permisos-y-argumentos)
9. [Menú](#-menú)
10. [APIs externas](#-apis-externas)
11. [Crear tu propio comando](#-crear-tu-propio-comando)
12. [Estructura del proyecto](#-estructura-del-proyecto)
13. [Solución de problemas](#-solución-de-problemas)
14. [Seguridad y buenas prácticas](#-seguridad-y-buenas-prácticas)

---

## ✨ Características

| | |
|---|---|
| 🔗 **Pairing Code** | Vinculación escribiendo un código de 8 dígitos, sin escanear QR |
| 💾 **Sesión persistente** | Se guarda en `sessions/`; al reiniciar no hay que volver a vincular |
| ♻️ **Reconexión automática** | Reintentos con espera progresiva ante caídas de red |
| 🧩 **Plugins** | Cada comando es un archivo en `bot/commands/<categoría>/`; se cargan solos |
| 🎌 **Menú dinámico** | Banner + tarjeta con datos reales + botón/lista de categorías y respaldo en texto |
| 🔐 **Permisos reales** | Ⓟ premium · Ⓛ límite diario · Ⓞ owner · Ⓐ admin (se comprueban de verdad) |
| 📌 **Validación de argumentos** | `<obligatorio>` y `[opcional]` se validan automáticamente |
| ★ **XP y niveles** | Experiencia por actividad, rangos y ranking global |
| ⚔️ **Economía y RPG** | Monedas, inventario, tienda, trabajo, minería, caza, aventuras y robos |
| 🗄️ **Base de datos** | JSON persistente con escritura atómica, autoguardado y migración de esquema |
| ◩ **Stickers y multimedia** | WebP con metadatos EXIF, conversiones de audio/vídeo y efectos de voz |
| 🌐 **APIs externas** | Todas centralizadas en `bot/lib/apiClient.js`, con claves solo desde `.env` |
| 🛡️ **Robusto** | Un comando que falla nunca tumba el bot; los temporales se borran siempre |

---

## 📱 Instalación en Termux

> Descarga Termux desde [F-Droid](https://f-droid.org/packages/com.termux/) (la versión de Play Store está obsoleta).

```bash
pkg update -y
pkg install nodejs-lts git ffmpeg -y

git clone https://github.com/lyanvalentinmail-prog/Bot-base.git
cd Bot-base
npm install
npm run setup
npm start
```

**Opcional** (descargas de YouTube: `.ytmp3`, `.ytmp4`, `.play`, `.yts`):

```bash
pkg install python -y
pip install -U yt-dlp
```

**Evitar que Android mate el proceso:**

```bash
termux-wake-lock     # mantiene el CPU despierto
```

También conviene desactivar la optimización de batería para Termux en los ajustes del sistema.

---

## 🖥️ Instalación en Linux / VPS

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install -y git ffmpeg curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

git clone https://github.com/lyanvalentinmail-prog/Bot-base.git
cd Bot-base
npm install
npm run setup
npm start
```

**Mantenerlo encendido 24/7 con pm2:**

```bash
npm install -g pm2
pm2 start bot/index.js --name bot-base
pm2 logs bot-base      # ver registros
pm2 save && pm2 startup
```

> La primera vinculación necesita una terminal interactiva para escribir el número.
> Con pm2 define antes `PAIRING_NUMBER` en el `.env`, o vincula una vez con `npm start` y luego arranca con pm2.

---

## 🔗 Vinculación con Pairing Code

1. Ejecuta `npm start`.
2. El bot pedirá el **número de WhatsApp del bot** en formato internacional, solo dígitos:

   ```
   📱 Escribe el número de WhatsApp del BOT (formato internacional, sin + ni espacios)
      Ejemplo: 5215512345678
      ›
   ```

3. Aparecerá un código de 8 caracteres:

   ```
   ╔════════════════════════════════════════════╗
   ║  🔗 CÓDIGO DE VINCULACIÓN (Pairing Code)   ║
   ║              ABCD-EFGH                     ║
   ╚════════════════════════════════════════════╝
   ```

4. En el teléfono del bot: **WhatsApp › Ajustes › Dispositivos vinculados › Vincular dispositivo › Vincular con el número de teléfono** e introduce el código.
5. Cuando veas `✅ conectado a WhatsApp`, envía `.menu` desde cualquier chat.

Para vincular otro número: `npm run reset-session` y vuelve a empezar.
Para no escribir el número cada vez, rellena `PAIRING_NUMBER` en el `.env`.

---

## ⚙️ Configuración (.env)

`npm run setup` crea el `.env` por ti. Puedes editarlo cuando quieras:

```ini
BOT_NAME=NombreBot          # Nombre que muestra el menú
BOT_VERSION=1.0.0
PREFIX=.                    # Prefijo de los comandos
OWNER_NAME=Owner
OWNER_NUMBER=               # TU número, solo dígitos (varios separados por comas)
BOT_MODE=public             # public | private

DEFAULT_LIMIT=10            # Usos diarios Ⓛ para usuarios normales
PREMIUM_LIMIT=50            # Usos diarios Ⓛ para premium

OPENAI_API_KEY=             # .chat .grammar .imagine .tts
GEMINI_API_KEY=             # .ask
WEATHER_API_KEY=            # .weather
REMOVE_BG_API_KEY=          # .removebg

NODE_ENV=production
```

Variables opcionales (ya incluidas en `.env.example`): `LOG_LEVEL`, `PAIRING_NUMBER`, `SESSION_NAME`,
`OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`, `OPENAI_TTS_MODEL`, `GEMINI_MODEL`, `COMMAND_COOLDOWN`,
`ENABLE_GROUPS`, `AUTO_READ`.

> ⚠️ El **owner se identifica únicamente por `OWNER_NUMBER`**. Si lo dejas vacío, ningún comando Ⓞ funcionará.
> El prefijo y el modo también se pueden cambiar en caliente con `.setprefix`, `.public` y `.private`
> (esos valores quedan guardados en la base de datos y tienen prioridad sobre el `.env`).

---

## 🧰 Scripts de npm

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia el bot |
| `npm run dev` | Inicia con recarga automática al guardar (`node --watch`) |
| `npm run setup` | Asistente: crea carpetas, genera el `.env`, comprueba ffmpeg/yt-dlp y valida los comandos |
| `npm run reset-session` | Borra la sesión para vincular otro número |
| `npm run check` | Diagnóstico completo: imports, comandos, menú, base de datos, permisos y `.gitignore` |
| `npm run clean` | Vacía `assets/temp/` |

---

## 📚 Comandos

El listado real y el total se generan **automáticamente** a partir de los archivos de `bot/commands/`.
Dentro de WhatsApp:

```
.menu              → menú principal con banner y botón
.menu list         → categorías
.menu tools        → comandos de una categoría
.commands          → todos los comandos
.cmd <comando>     → ayuda detallada de un comando
```

### Categorías

| Categoría | Ejemplos |
|---|---|
| ◈ **MAIN** | `.menu` · `.commands` · `.ping` · `.cmd <comando>` |
| ⓘ **INFO** | `.botinfo` · `.owner` · `.runtime` · `.servicios` |
| ♢ **FUN** | `.ship <@u1> <@u2>` · `.8ball <pregunta>` · `.meme` · `.chiste` · `.dado` · `.rate` · `.verdadreto` |
| ⚒ **TOOLS** | `.weather <ciudad>` · `.translate <idioma> <texto>` · `.qr <texto>` · `.leerqr` · `.calc` · `.divisa` · `.ip` · `.hora` · `.hash` · `.base64` · `.password` · `.acortar` |
| ◎ **INTERNET** | `.wikipedia` · `.ddg` · `.urban` · `.crypto` · `.libro` |
| ◉ **STALK** | `.githubstalk` · `.npmstalk` · `.redditstalk` · `.mcstalk` |
| ✿ **ANIME** | `.anime` · `.manga` · `.personaje` · `.waifu` · `.neko` |
| ♟ **GAME** | `.math` · `.trivia` · `.ttt <@usuario>` · `.adivina` |
| ⚔ **RPG** | `.daily` · `.work` · `.mine` · `.hunt` · `.adventure` · `.inventory` · `.balance` · `.pay` · `.rob` · `.heal` |
| ★ **XP** | `.perfil` · `.nivel` · `.leaderboard` |
| ◇ **AI** | `.chat <mensaje>` Ⓛ · `.ask <pregunta>` Ⓛ · `.grammar <texto>` · `.imagine <prompt>` Ⓟ |
| ♫ **AUDIO** | `.tomp3` · `.tovn` · `.cortar` · `.volumen` |
| ⇩ **DOWNLOADER** | `.ytmp3 <url>` · `.ytmp4 <url> [calidad]` · `.getfile <url>` |
| ▣ **IMAGE** | `.blur` · `.bw` · `.invertir` · `.flip` · `.circulo` · `.pixelar` · `.resize` · `.removebg` Ⓟ |
| ✎ **MAKER** | `.ttp <texto>` · `.attp <texto>` · `.textimg <texto>` |
| ⚙ **PANEL** | `.kick` Ⓐ · `.promote` Ⓐ · `.demote` Ⓐ · `.grupo` Ⓐ · `.antilink` Ⓐ · `.welcome` Ⓐ · `.tagall` Ⓐ · `.hidetag` Ⓐ · `.mute` Ⓐ · `.infogrupo` |
| ❝ **QUOTES** | `.quote` · `.motivacion` |
| ۞ **QURAN** | `.surah [número]` · `.ayah <sura:aleya>` · `.quranaudio <sura:aleya>` |
| ⟳ **RANDOM** | `.gato` · `.perro` · `.consejo` · `.dato` · `.elige` |
| ⌕ **SEARCH** | `.yts` · `.itunes` · `.lyrics` · `.serie` · `.repo` |
| ♪ **SOUND** | `.play <canción>` · `.deezer <canción>` |
| ◩ **STICKER** | `.sticker` · `.toimg` · `.tovid` · `.swm <pack>|[autor]` |
| ♜ **STORE** | `.shop` · `.buy <objeto> [cantidad]` · `.sell <objeto> [cantidad]` |
| ♬ **VOICE** | `.tts <texto>` · `.bass` · `.nightcore` · `.slow` · `.deep` · `.robot` · `.reverse` |
| ♛ **OWNER** | `.public` · `.private` · `.setprefix` · `.ban` · `.unban` · `.addprem` · `.delprem` · `.blockcmd` · `.setlimit` · `.broadcast` · `.reload` · `.restart` · `.leave` · `.dbstats` |

---

## 🔐 Permisos y argumentos

### Permisos

| Símbolo | Significado | Cómo se concede |
|---|---|---|
| *(ninguno)* | Público | — |
| Ⓛ | Consume límite diario | `DEFAULT_LIMIT` / `PREMIUM_LIMIT`, se reinicia a las 00:00 UTC |
| Ⓟ | Solo premium | `.addprem @usuario <días>` |
| Ⓞ | Solo propietario | `OWNER_NUMBER` del `.env` |
| Ⓐ | Solo admins del grupo | Ser administrador del grupo |

```
.ping                    ← público
.chat <mensaje> Ⓛ        ← gasta 1 límite
.imagine <prompt> Ⓟ      ← solo premium
.kick <@usuario> Ⓐ       ← solo admins
.restart Ⓞ               ← solo owner
```

Los permisos se comprueban en `bot/middleware/` antes de ejecutar nada: **no son decorativos**.
Si un comando falla por un error del propio bot, el límite consumido se devuelve.

### Argumentos

```
<argumento>   obligatorio   →  .weather <ciudad>
[argumento]   opcional      →  .ytmp4 <url> [calidad]
```

Si falta un argumento obligatorio, el bot responde con el uso correcto y un ejemplo; el comando no se ejecuta.
Para comandos de multimedia, un archivo adjunto o citado cuenta como argumento.

---

## 🎌 Menú

`.menu` envía `assets/banner.jpg` con la tarjeta de información (nombre, owner, versión, modo, estado,
tiempo activo, usuario, prefijo y total de comandos — todo dinámico) y el botón **📚 VER LISTA DE COMANDOS**.

Al pulsarlo se abre la lista de categorías. Si el cliente de WhatsApp no soporta mensajes interactivos,
el bot envía automáticamente el mismo contenido en texto, con los comandos escribibles: nunca te quedas sin menú.

Cada categoría se muestra en small caps (solo presentación; los comandos reales siguen siendo `.chat`, `.ping`…):

```
୨୧ ❏ ◇ ᴀɪ
┊ ✿ .ᴀꜱᴋ <ᴘʀᴇɢᴜɴᴛᴀ> Ⓛ
┊ ✿ .ᴄʜᴀᴛ <ᴍᴇɴꜱᴀᴊᴇ> Ⓛ
┊ ✿ .ɢʀᴀᴍᴍᴀʀ <ᴛᴇxᴛᴏ> Ⓛ
┊ ✿ .ɪᴍᴀɢɪɴᴇ <ᴘʀᴏᴍᴘᴛ> Ⓛ Ⓟ
୨୧

ᴛᴏᴛᴀʟ : 4 ꜰɪᴛᴜʀ
Ⓟ ᴘʀᴇᴍɪᴜᴍ  Ⓛ ʟɪᴍɪᴛ  Ⓞ ᴏᴡɴᴇʀ  Ⓐ ᴀᴅᴍɪɴ
```

---

## 🌐 APIs externas

Todas las peticiones pasan por **`bot/lib/apiClient.js`**. Las claves salen exclusivamente del `.env`
y nunca se escriben en el código ni en los logs (el logger las censura).

### Con clave (opcionales)

| Servicio | Variable | Comandos | Dónde conseguirla |
|---|---|---|---|
| OpenAI | `OPENAI_API_KEY` | `.chat` `.grammar` `.imagine` `.tts` | <https://platform.openai.com/api-keys> |
| Google Gemini | `GEMINI_API_KEY` | `.ask` | <https://aistudio.google.com/app/apikey> |
| OpenWeatherMap | `WEATHER_API_KEY` | `.weather` | <https://home.openweathermap.org/api_keys> |
| remove.bg | `REMOVE_BG_API_KEY` | `.removebg` | <https://www.remove.bg/api> |

Si falta la clave, el comando responde:

```
⚠️ Este servicio no está configurado.

🔑 Falta la variable OPENAI_API_KEY en tu archivo .env
```

### Sin clave (públicas y documentadas)

Wikipedia · DuckDuckGo Instant Answer · Urban Dictionary · CoinGecko · Open Library · GitHub REST ·
registro de npm · Reddit (JSON público) · Mojang · Jikan (MyAnimeList) · waifu.pics · nekos.best ·
Al Quran Cloud · TheCatAPI · Dog CEO · Advice Slip · Useless Facts · Open Trivia DB · JokeAPI ·
Meme API · iTunes Search · lyrics.ovh · TVmaze · Deezer · Frankfurter (BCE) · MyMemory · goQR.me · is.gd · ipapi.co

### Descargas

`.ytmp3`, `.ytmp4`, `.play` y `.yts` usan [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) (binario del sistema)
y `.getfile` descarga enlaces directos. **Solo contenido público**: no se implementa ningún tipo de bypass
de DRM, muros de pago, CAPTCHA, autenticación ni acceso a contenido privado. Hay límites de duración y tamaño.

---

## 🧩 Crear tu propio comando

Crea un archivo en `bot/commands/<categoría>/<nombre>.js`. Se carga solo al reiniciar o con `.reload`.

```js
export default {
  name: 'saludo',                 // nombre del comando (sin prefijo)
  aliases: ['hola'],              // alias opcionales
  category: 'fun',                // normalmente la carpeta
  args: '<nombre> [emoji]',       // <obligatorio> [opcional]
  description: 'Saluda a alguien',
  example: 'saludo Ana 👋',       // opcional, se muestra si faltan argumentos
  limit: false,                   // Ⓛ consume límite diario
  premium: false,                 // Ⓟ solo premium
  owner: false,                   // Ⓞ solo propietario
  admin: false,                   // Ⓐ solo admins del grupo
  botAdmin: false,                // el bot debe ser admin
  group: false,                   // solo en grupos
  private: false,                 // solo en privado
  cooldown: 5,                    // segundos entre usos (por usuario)
  mediaArg: false,                // un adjunto/cita cuenta como argumento
  hidden: false,                  // ocultar del menú

  async exec ({ sock, m, args, text, user, group, prefix, isOwner, isAdmin, registry }) {
    await m.reply(`¡Hola ${args[0]}! ${args[1] || '👋'}`)
  }
}
```

**Contexto disponible en `exec`:** `sock` (socket de Baileys), `m` (mensaje serializado con
`reply()`, `react()`, `download()`, `downloadAny()`, `quoted`, `mentionedJid`…), `args`, `text`,
`user` y `group` (registros de la base de datos), `metadata` (del grupo), `settings`, `prefix`,
`isOwner`, `isAdmin`, `isBotAdmin`, `registry` y `runtime`.

Para errores que el usuario debe leer, lanza `UserError`; cualquier otro error se registra y el
usuario solo ve un mensaje genérico (nunca un stack trace).

---

## 🗂️ Estructura del proyecto

```
bot/
├── index.js              Arranque, comprobaciones y manejo global de errores
├── connection.js         Baileys, Pairing Code, reconexión y eventos
├── handler.js            Orquestador de mensajes (pequeño a propósito)
├── config.js             Configuración desde .env
├── commands/             25 categorías · un archivo por comando
├── database/             Almacén JSON persistente, esquemas y API de datos
├── lib/                  apiClient · menu · buttons · sticker · ffmpeg · ytdlp · image
│                         loader · serialize · games · levelling · logger · tmp · …
└── middleware/           banned · mode · disabled · scope · permissions · args · cooldown · limit

assets/
├── banner.jpg            Imagen del menú
└── temp/                 Temporales (se limpian solos)

sessions/                 Credenciales de WhatsApp (ignoradas por git)
data/                     database.json (ignorado por git)
scripts/                  setup · reset-session · check · clean-temp
```

---

## 🩺 Solución de problemas

<details>
<summary><b>No aparece el Pairing Code / «No hay terminal interactiva»</b></summary>

Estás ejecutando el bot sin terminal (pm2, systemd, nohup…). Define `PAIRING_NUMBER=<tu número>`
en el `.env` o vincula una primera vez con `npm start`.
</details>

<details>
<summary><b>El código caduca o dice «Error de emparejamiento»</b></summary>

El código dura unos minutos. Reinicia con `npm start` para pedir otro. Si falla varias veces:
`npm run reset-session && npm start`. Comprueba también que el número tenga el código de país
correcto y sin `+`, espacios ni guiones.
</details>

<details>
<summary><b>«sesión no válida» o se desconecta nada más conectar</b></summary>

Cerraste la sesión desde el teléfono o se abrió el mismo número en otra instancia.
Ejecuta `npm run reset-session` y vuelve a vincular. No ejecutes dos copias del bot con el mismo número.
</details>

<details>
<summary><b>Los stickers, el audio o los vídeos no funcionan</b></summary>

Falta **ffmpeg**: `pkg install ffmpeg -y` (Termux) o `sudo apt install ffmpeg -y` (Linux).
Compruébalo con `.servicios` o `npm run check`.
</details>

<details>
<summary><b>`.ytmp3` / `.play` dicen que falta yt-dlp</b></summary>

```bash
pkg install python -y && pip install -U yt-dlp     # Termux
sudo pip install -U yt-dlp                         # Linux
```
Si una descarga falla, actualiza yt-dlp: `pip install -U yt-dlp`.
</details>

<details>
<summary><b>«⚠️ Este servicio no está configurado»</b></summary>

Ese comando necesita una API key. Añádela en el `.env` y reinicia el bot. Mira qué falta con `.servicios`.
</details>

<details>
<summary><b>El bot no responde en grupos</b></summary>

Comprueba: que no esté en modo privado (`.public`), que el grupo no esté silenciado (`.mute off`),
que `ENABLE_GROUPS=true` y que no estés baneado.
</details>

<details>
<summary><b>Los botones no aparecen</b></summary>

WhatsApp no entrega mensajes interactivos en todas las versiones/cuentas. El bot lo detecta y envía
el mismo menú en texto; las opciones siguen funcionando escribiéndolas (`.menu list`, `.menu ai`…).
</details>

<details>
<summary><b>Termux mata el bot al bloquear la pantalla</b></summary>

Ejecuta `termux-wake-lock` y desactiva la optimización de batería para Termux.
</details>

<details>
<summary><b>«Cannot find package 'pino'» (o cualquier otro paquete)</b></summary>

Faltan las dependencias: `npm install` no se ejecutó o se cortó a mitad. Desde la carpeta del proyecto:

```bash
cd ~/Bot-base
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run setup
```

En Termux, `git` es **obligatorio** (Baileys descarga una dependencia desde GitHub):
`pkg install nodejs-lts git -y`. Los scripts del bot detectan este caso y te indican qué ejecutar.
</details>

<details>
<summary><b>Errores al instalar en Termux</b></summary>

```bash
pkg update -y && pkg upgrade -y
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```
</details>

---

## 🔒 Seguridad y buenas prácticas

- **Nunca subas** `.env`, `sessions/` ni `data/` (ya están en `.gitignore`).
- Las claves se leen solo del entorno y el logger las **censura** antes de escribir nada.
- Al usuario nunca se le muestran stack traces; los detalles quedan en los logs.
- Los archivos temporales se borran al terminar cada comando y un barrido periódico limpia lo que quede.
- Un comando que falla no afecta al resto del bot (`uncaughtException` y `unhandledRejection` controlados).
- La calculadora usa un analizador propio: **no hay `eval`** en el proyecto.
- Si compartes tu servidor, recuerda que `OWNER_NUMBER` da control total del bot.

---

## 📄 Licencia

MIT. Este proyecto no está afiliado a WhatsApp ni a Meta. Úsalo respetando los
[Términos de Servicio de WhatsApp](https://www.whatsapp.com/legal/terms-of-service) y la normativa aplicable.
