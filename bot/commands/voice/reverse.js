import { makeVoiceEffect } from './_effect.js'

export default makeVoiceEffect({
  name: 'reverse',
  aliases: ['reves', 'alreves'],
  filter: 'reverse',
  description: 'Reproducir un audio al revés',
  emoji: '🔄'
})
