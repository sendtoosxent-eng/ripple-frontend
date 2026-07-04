"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { Waveform } from "@/components/waveform"
import { cn } from "@/lib/utils"

export function VoiceNote({
  duration,
  waveform,
  mine,
  src,
}: {
  duration: string
  waveform: number[]
  mine: boolean
  src?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!src) return
    const audio = new Audio(src)
    audioRef.current = audio

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    const onEnd = () => {
      setPlaying(false)
      setProgress(0)
    }

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnd)

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnd)
    }
  }, [src])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => {})
      setPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        onClick={toggle}
        disabled={!src}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50",
          mine ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {playing ? <Pause className="size-4.5" /> : <Play className="size-4.5 translate-x-px" />}
      </button>
      <Waveform
        bars={waveform}
        progress={progress}
        className="w-36"
        barClassName={mine ? "bg-primary-foreground/40" : "bg-muted-foreground/40"}
        activeClassName={mine ? "bg-primary-foreground" : "bg-primary"}
      />
      <span
        className={cn(
          "shrink-0 font-mono text-xs tabular-nums",
          mine ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {duration}
      </span>
    </div>
  )
}
