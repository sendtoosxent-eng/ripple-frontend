"use client"

import { useEffect, useRef, useState } from "react"
import { CornerUpLeft, MoreHorizontal } from "lucide-react"
import { VoiceNote } from "@/components/chat/voice-note"
import { UserAvatar } from "@/components/user-avatar"
import type { Message } from "@/lib/data"
import { cn } from "@/lib/utils"

const QUICK_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🙏"]

function DeliveryDots({ status }: { status?: string }) {
  if (!status) return null
  if (status === "failed") return <span role="img" aria-label="Failed to send" title="Failed to send" className="size-2 rounded-full bg-destructive ring-2 ring-destructive/20" />
  if (status === "sending") return <span role="img" aria-label="Sending" title="Sending" className="size-2 animate-pulse rounded-full border border-primary-foreground/70 motion-reduce:animate-none" />
  const count = status === "read" ? 3 : status === "delivered" ? 2 : 1
  const label = status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent"
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} aria-hidden="true" className={cn("size-1.5 rounded-full", status === "read" ? "bg-primary-foreground" : "bg-primary-foreground/60")} />
      ))}
    </span>
  )
}

export function MessageBubble({
  message,
  onExpandImage,
  isGroup,
  onReact,
  onReply,
  onRetry,
}: {
  message: Message
  onExpandImage?: (src: string) => void
  isGroup?: boolean
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
  onRetry?: (message: Message) => void
}) {
  const mine = message.from === "me"
  const showSender = isGroup && !mine
  const [pickerOpen, setPickerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setPickerOpen(false)
    }
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setPickerOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", escape)
    }
  }, [pickerOpen])

  return (
    <div ref={menuRef} className="group/msg flex w-full flex-col">
      <div className={cn("flex w-full items-end gap-2", mine ? "justify-end" : "justify-start")}>
        {!mine && (
          <div className="relative flex items-center pb-1">
            <button
              aria-label="Message actions"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((v) => !v)}
              className="flex size-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        )}

        {showSender && (
          <UserAvatar src={message.senderAvatar || "/avatars/you.png"} name={message.senderName || "?"} size="sm" className="mb-0.5 shrink-0" />
        )}

        <div className="relative max-w-[78%]">
          {pickerOpen && (
            <div role="menu" aria-label="Message actions"
              className={cn(
                "absolute -top-12 z-20 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-xl",
                mine ? "right-0" : "left-0",
              )}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  role="menuitem"
                  aria-label={`React with ${emoji}`}
                  onClick={() => {
                    onReact?.(message.id, emoji)
                    setPickerOpen(false)
                  }}
                  className="flex size-8 items-center justify-center rounded-full text-lg hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
              <span className="mx-0.5 h-6 w-px bg-border" />
              <button role="menuitem" aria-label="Reply to message" onClick={() => { onReply?.(message); setPickerOpen(false) }} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><CornerUpLeft className="size-4" /></button>
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

            {message.statusReplyPreview && (
              <div
                className={cn(
                  "mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                  mine ? "bg-primary-foreground/10" : "bg-foreground/5",
                )}
              >
                {message.statusReplyPreview.type === "image" && message.statusReplyPreview.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={message.statusReplyPreview.mediaUrl} alt="Status" className="size-8 shrink-0 rounded object-cover" />
                ) : (
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded text-[0.6rem] font-semibold text-white"
                    style={{ backgroundColor: message.statusReplyPreview.background || "#25D366" }}
                  >
                    Aa
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold opacity-90">Replied to status</p>
                  {message.statusReplyPreview.text && <p className="truncate opacity-70">{message.statusReplyPreview.text}</p>}
                </div>
              </div>
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
              {mine && <DeliveryDots status={message.status} />}
            </div>
          </div>

          {mine && message.status === "failed" && (
            <button onClick={() => onRetry?.(message)} className="mt-1 text-xs font-semibold text-destructive hover:underline">Retry</button>
          )}

          {!!message.reactions?.length && (
            <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  aria-label={`React with ${r.emoji}${r.count > 1 ? `, ${r.count} reactions` : ""}`}
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
          <div className="relative flex items-center pb-1">
            <button
              aria-label="Message actions"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((v) => !v)}
              className="flex size-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
