type CallTone = "ringback" | "incoming"

export function startCallTone(kind: CallTone): () => void {
  if (typeof window === "undefined") return () => {}

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return () => {}

  let context: AudioContext | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let stopped = false

  const sound = () => {
    if (stopped) return
    try {
      context ??= new AudioContextClass()
      void context.resume()
      const now = context.currentTime
      const notes = kind === "incoming"
        ? [{ frequency: 880, start: 0, duration: 0.38 }, { frequency: 740, start: 0.48, duration: 0.38 }]
        : [{ frequency: 440, start: 0, duration: 0.3 }, { frequency: 480, start: 0.38, duration: 0.3 }]

      notes.forEach(({ frequency, start, duration }) => {
        const oscillator = context!.createOscillator()
        const gain = context!.createGain()
        oscillator.type = "sine"
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.0001, now + start)
        gain.gain.exponentialRampToValueAtTime(kind === "incoming" ? 0.18 : 0.1, now + start + 0.025)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
        oscillator.connect(gain).connect(context!.destination)
        oscillator.start(now + start)
        oscillator.stop(now + start + duration + 0.03)
      })
      if (kind === "incoming") navigator.vibrate?.([350, 120, 350])
    } catch {}
  }

  sound()
  timer = setInterval(sound, kind === "incoming" ? 1800 : 3000)

  return () => {
    stopped = true
    if (timer) clearInterval(timer)
    navigator.vibrate?.(0)
    if (context) void context.close().catch(() => {})
  }
}
