"use client"

import { Check, CheckCheck } from "lucide-react"
import { VoiceNote } from "@/components/chat/voice-note"
import type { Message } from "@/lib/data"
import { cn } from "@/lib/utils"

function Ticks({ status }: { status?: string }) {
  if (!status) return null
  if (status === "read")
    return <CheckCheck className="size-3.5 text-primary-foreground/90" />
  if (status === "delivered")
    return <CheckCheck className="size-3.5 text-primary-foreground/60" />
  return <Check className="size-3.5 text-primary-foreground/60" />
}

export function MessageBubble({
  message,
  onExpandImage,
}: {
  message: Message
  onExpandImage?: (src: string) => void
}) {
  const mine = message.from === "me"

  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] shadow-sm",
          message.type === "image" ? "overflow-hidden rounded-2xl" : "rounded-2xl px-3.5 py-2",
          mine
            ? "bg-bubble-sent text-bubble-sent-foreground rounded-br-md"
            : "bg-bubble-received text-bubble-received-foreground rounded-bl-md",
        )}
      >
        {message.type === "text" && (
          <p className="text-pretty text-[0.95rem] leading-relaxed">{message.text}</p>
        )}

        {message.type === "voice" && (
          <div className="py-1">
            <VoiceNote duration={message.duration} waveform={message.waveform} mine={mine} src={message.src} />
          </div>
        )}

        {message.type === "image" && (
          <figure>
            <button
              type="button"
              onClick={() => onExpandImage?.(message.src)}
              className="block w-full"
              aria-label="Expand image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.src || "/placeholder.svg"}
                alt={message.caption ?? "Shared photo"}
                className="max-h-72 w-full object-cover"
              />
            </button>
            {message.caption && (
              <figcaption className="px-3.5 py-2 text-[0.95rem] leading-relaxed">
                {message.caption}
              </figcaption>
            )}
          </figure>
        )}

        <div
          className={cn(
            "flex items-center justify-end gap-1",
            message.type === "image" && !message.caption ? "px-3.5 pb-2 pt-1" : "",
            message.type === "image" && message.caption ? "px-3.5 pb-2" : "mt-0.5",
          )}
        >
          <span
            className={cn(
              "text-[0.65rem]",
              mine ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {message.time}
          </span>
          {mine && <Ticks status={message.status} />}
        </div>
      </div>
    </div>
  )
}
