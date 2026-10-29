let context = null

function getContext() {
  if (typeof window === 'undefined') return null
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    context = new AudioContextClass()
  }
  if (context.state === 'suspended') {
    context.resume().catch(() => {})
  }
  return context
}

export function unlockAudio() {
  getContext()
}

export function tone({ frequency = 660, duration = 0.08, volume = 0.05, type = 'sine' } = {}) {
  const audio = getContext()
  if (!audio) return

  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const now = audio.currentTime

  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.02)
}

export function beepCountdown(n) {
  tone({ frequency: n <= 1 ? 880 : 620, duration: 0.09, volume: 0.05 })
}

export function beepGo() {
  tone({ frequency: 1040, duration: 0.16, volume: 0.05 })
}

export function shutter(index) {
  tone({
    frequency: index % 5 === 0 ? 1320 : 1080,
    duration: 0.025,
    volume: 0.022,
    type: 'triangle',
  })
}
