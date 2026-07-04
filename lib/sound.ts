// lib/sound.ts
// Plays a short, pleasant notification chime using the Web Audio API.
// No audio file needed — synthesized on the fly.

let ctx: AudioContext | null = null

function getCtx() {
  if (typeof window === "undefined") return null
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

export function playNotificationSound() {
  const audioCtx = getCtx()
  if (!audioCtx) return

  const now = audioCtx.currentTime
  const notes = [880, 1108] // a friendly two-tone "ping"

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = "sine"
    osc.frequency.value = freq
    const start = now + i * 0.09
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.15, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(start)
    osc.stop(start + 0.25)
  })
}
