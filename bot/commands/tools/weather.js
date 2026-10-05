/** Clima actual con OpenWeatherMap (requiere WEATHER_API_KEY). */
import { weather } from '../../lib/apiClient.js'
import { formatDate } from '../../lib/functions.js'

export default {
  name: 'weather',
  aliases: ['clima', 'tiempo-clima'],
  category: 'tools',
  args: '<ciudad>',
  description: 'Consultar el clima de una ciudad',
  example: 'weather Madrid',
  limit: true,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    await m.react('🌦️')
    const data = await weather.current(text)

    const sunrise = new Date((data.sys.sunrise + data.timezone) * 1000)
    const sunset = new Date((data.sys.sunset + data.timezone) * 1000)

    await m.reply(
      `╭─❏ *CLIMA EN ${data.name.toUpperCase()}, ${data.sys.country}*\n` +
      `│ 🌡️ Temperatura ☇ *${Math.round(data.main.temp)}°C* (sensación ${Math.round(data.main.feels_like)}°C)\n` +
      `│ 📉 Mín/Máx ☇ ${Math.round(data.main.temp_min)}°C / ${Math.round(data.main.temp_max)}°C\n` +
      `│ ☁️ Estado ☇ ${data.weather[0].description}\n` +
      `│ 💧 Humedad ☇ ${data.main.humidity}%\n` +
      `│ 🌬️ Viento ☇ ${(data.wind.speed * 3.6).toFixed(1)} km/h\n` +
      `│ 🔽 Presión ☇ ${data.main.pressure} hPa\n` +
      `│ 👁️ Visibilidad ☇ ${((data.visibility || 0) / 1000).toFixed(1)} km\n` +
      `│ 🌅 Amanecer ☇ ${formatDate(sunrise).split(', ')[1] || formatDate(sunrise)}\n` +
      `│ 🌇 Atardecer ☇ ${formatDate(sunset).split(', ')[1] || formatDate(sunset)}\n` +
      `╰━━━━━━━━━━━━━━━⬣\n\n_Datos de OpenWeatherMap_`
    )
  }
}
