"use client"

import { useState } from "react"
import { Check, CheckCheck, CornerUpLeft, SmilePlus } from "lucide-react"
import { VoiceNote } from "@/components/chat/voice-note"
import { UserAvatar } from "@/components/user-avatar"
import type { Message } from "@/lib/data"
import { cn } from "@/lib/utils"

const QUICK_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🙏"]

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
  isGroup,
  onReact,
  onReply,
}: {
  message: Message
  onExpandImage?: (src: string) => void
  isGroup?: boolean
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
}) {
  const mine = message.from === "me"
  const showSender = isGroup && !mine
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="group/msg flex w-full flex-col">
      <div className={cn("flex w-full items-end gap-2", mine ? "justify-end" : "justify-start")}>
        {!mine && (
          <div className="flex flex-col items-center gap-1 pb-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
            <button
              aria-label="React"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
            >
              <SmilePlus className="size-3.5" />
            </button>
            <button
              aria-label="Reply"
              onClick={() => onReply?.(message)}
              className="flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
            >
              <CornerUpLeft className="size-3.5" />
            </button>
          </div>
        )}

        {showSender && (
          <UserAvatar src={message.senderAvatar || "/avatars/you.png"} name={message.senderName || "?"} size="sm" className="mb-0.5 shrink-0" />
        )}

        <div className="relative max-w-[78%]">
          {pickerOpen && (
            <div
              className={cn(
                "absolute -top-11 z-10 flex gap-1 rounded-full bg-card px-2 py-1.5 shadow-lg",
                mine ? "right-0" : "left-0",
              )}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact?.(message.id, emoji)
                    setPickerOpen(false)
                  }}
                  className="text-lg transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div
            className={cn(
              "shadow-sm",
              message.type === "image" ? "overflow-hidden rounded-2xl" : "rounded-2xl px-3.5 py-2",
              mine
                ? "bg-bubble-sent text-bubble-sent-foreground rounded-br-md"
                : "bg-bubble-received text-bubble-received-foreground rounded-bl-md",
            )}
          >
            {showSender && (
              <p className="px-0.5 pb-0.5 text-xs font-semibold text-primary">{message.senderName}</p>
            )}

            {message.replyPreview && (
              <div
                className={cn(
                  "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs",
                  mine ? "border-primary-foreground/50 bg-primary-foreground/10" : "border-primary bg-foreground/5",
                )}
              >
                <p className="font-semibold">{message.replyPreview.senderName}</p>
                <p className="truncate opacity-80">{message.replyPreview.preview}</p>
              </div>
            )}

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

          {!!message.reactions?.length && (
            <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(message.id, r.emoji)}
                  className="flex items-center gap-0.5 rounded-full bg-card px-1.5 py-0.5 text-xs shadow-sm"
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="text-muted-foreground">{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {mine && (
          <div className="flex flex-col items-center gap-1 pb-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
            <button
              aria-label="React"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
            >
              <SmilePlus className="size-3.5" />
            </button>
            <button
              aria-label="Reply"
              onClick={() => onReply?.(message)}
              className="flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
            >
              <CornerUpLeft className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
