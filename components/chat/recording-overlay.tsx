"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, Mic, Send, Trash2 } from "lucide-react"
import { Waveform } from "@/components/waveform"

const liveBars = Array.from({ length: 40 }, (_, i) => 0.3 + Math.abs(Math.sin(i)) * 0.7)

export function RecordingOverlay({
  onCancel,
  onSend,
}: {
  onCancel: () => void
  onSend: (blob: Blob, duration: string) => void
}) {
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const startRef = useRef(Date.now())
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const mimeTypeRef = useRef<string>("audio/webm")

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 250)

    const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
    const supported = preferred.find((t) => MediaRecorder.isTypeSupported(t)) || ""
    mimeTypeRef.current = supported || "audio/webm"

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream
        const recorder = new MediaRecorder(stream, supported ? { mimeType: supported } : undefined)
        recorderRef.current = recorder
        chunksRef.current = []
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
        recorder.start()
        startRef.current = Date.now()
      })
      .catch(() => setError("Microphone access denied. Enable it in your browser settings."))

    return () => {
      clearInterval(id)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const mm = Math.floor(seconds / 60)
  const ss = (seconds % 60).toString().padStart(2, "0")
  const duration = `${mm}:${ss}`

  function stopAndGetBlob(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder) return resolve(new Blob())
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: mimeTypeRef.current }))
      recorder.stop()
    })
  }

  async function handleSend() {
    const blob = await stopAndGetBlob()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onSend(blob, duration === "0:00" ? "0:01" : duration)
  }

  function handleCancel() {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onCancel()
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 border-t border-border bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mb-3 flex flex-col items-center gap-2 rounded-2xl bg-destructive/10 p-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-destructive">
              <span className="size-2.5 animate-pulse rounded-full bg-destructive" />
              Recording
            </span>
            <Waveform
              bars={liveBars}
              progress={1}
              animated
              className="h-10 w-full max-w-xs justify-center"
              activeClassName="bg-destructive"
              barClassName="bg-destructive"
            />
            <span className="font-mono text-sm tabular-nums text-foreground">{duration}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Cancel
        </button>

        <span className="flex animate-pulse items-center gap-1 text-xs font-medium text-muted-foreground">
          <ChevronLeft className="size-4" />
          Slide to cancel
        </span>

        <div className="flex items-center gap-3">
          <Mic className="size-5 text-destructive" />
          <button
            type="button"
            aria-label="Send voice message"
            disabled={!!error}
            onClick={handleSend}
            className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
