"use client"

import { useState } from "react"
import { Send, Smile, X } from "lucide-react"

export function ImagePreview({
  src,
  onClose,
  onSend,
}: {
  src: string
  onClose: () => void
  onSend: (caption: string) => void
}) {
  const [caption, setCaption] = useState("")

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-foreground/95 backdrop-blur">
      <header className="flex items-center justify-between px-4 py-4 text-background">
        <button
          type="button"
          aria-label="Cancel"
          onClick={onClose}
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-background/10"
        >
          <X className="size-6" />
        </button>
        <span className="text-sm font-medium">Send photo</span>
        <span className="size-11" />
      </header>

      <div className="flex flex-1 items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src || "/placeholder.svg"}
          alt="Selected preview"
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
        />
      </div>

      <div className="flex items-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex h-12 flex-1 items-center gap-2 rounded-full bg-background/15 px-4 text-background backdrop-blur focus-within:ring-2 focus-within:ring-background/40">
          <Smile className="size-5 text-background/70" />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full bg-transparent text-sm text-background outline-none placeholder:text-background/60"
          />
        </div>
        <button
          type="button"
          aria-label="Send"
          onClick={() => onSend(caption)}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-95"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  )
}
