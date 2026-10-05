import { makeVoiceEffect } from './_effect.js'

export default makeVoiceEffect({
  name: 'bass',
  aliases: ['graves'],
  filter: 'bass',
  description: 'Aumentar los graves de un audio',
  emoji: '🔉'
})
