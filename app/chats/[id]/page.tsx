"use client"

import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ImageIcon, Mic, Phone, Plus, Send, Video, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { MessageBubble } from "@/components/chat/message-bubble"
import { RecordingOverlay } from "@/components/chat/recording-overlay"
import { ImagePreview } from "@/components/chat/image-preview"
import { UserAvatar } from "@/components/user-avatar"
import type { Conversation, Message } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { toUiConversation, toUiMessage } from "@/lib/transform"
import { getEcho } from "@/lib/echo"
import { playNotificationSound } from "@/lib/sound"
import { getWallpaper, getWallpaperClassName } from "@/lib/wallpaper"
import { cn } from "@/lib/utils"

export default function ChatRoomPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [notFoundFlag, setNotFoundFlag] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [recording, setRecording] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [otherTyping, setOtherTyping] = useState(false)
  const [otherRecording, setOtherRecording] = useState(false)
  const [wallpaperClass, setWallpaperClass] = useState(getWallpaperClassName("default"))
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setWallpaperClass(getWallpaperClassName(getWallpaper()))
  }, [])

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  // Fetch the conversation + its message history
  useEffect(() => {
    if (!user) return
    api
      .getConversation(params.id)
      .then((data) => {
        const ui = toUiConversation(data, user.id)
        setConversation(ui)
        setMessages(ui.messages)
        // mark everything as read now that we've opened the chat
        api.markConversationRead(params.id).catch(() => {})
      })
      .catch(() => setNotFoundFlag(true))
  }, [params.id, user])

  // Subscribe to the private channel: new messages, typing, recording, read receipts — all live
  useEffect(() => {
    if (!user) return
    const echo = getEcho()
    if (!echo) return

    const channel = echo.private(`conversation.${params.id}`)
    channelRef.current = channel

    channel.listen(".message.sent", (e: { message: any }) => {
      setMessages((m) => [...m, toUiMessage(e.message, user.id)])
      setOtherTyping(false)
      setOtherRecording(false)
      if (e.message.sender_id !== user.id) playNotificationSound()
      // I'm actively viewing this chat, so mark it read immediately
      api.markConversationRead(params.id).catch(() => {})
    })

    channel.listen(".messages.read", () => {
      setMessages((m) => m.map((msg) => (msg.from === "me" ? { ...msg, status: "read" } : msg)))
    })

    channel.listenForWhisper("typing", (e: { userId: number }) => {
      if (e.userId === user.id) return
      setOtherTyping(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000)
    })

    channel.listenForWhisper("recording", (e: { userId: number; active: boolean }) => {
      if (e.userId === user.id) return
      setOtherRecording(e.active)
    })

    return () => {
      echo.leave(`conversation.${params.id}`)
    }
  }, [params.id, user])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, otherTyping, otherRecording])

  if (notFoundFlag) notFound()
  if (authLoading || !user || !conversation) return null

  function notifyTyping() {
    channelRef.current?.whisper("typing", { userId: user!.id })
  }

  function notifyRecording(active: boolean) {
    channelRef.current?.whisper("recording", { userId: user!.id, active })
  }

  const sendText = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    const saved = await api.sendTextMessage(params.id, text)
    setMessages((m) => [...m, toUiMessage(saved, user.id)])
  }

  const sendVoice = async (blob: Blob, duration: string) => {
    setRecording(false)
    notifyRecording(false)
    const saved = await api.sendVoiceMessage(params.id, blob, duration)
    setMessages((m) => [...m, toUiMessage(saved, user.id)])
  }

  const sendImage = async (caption: string) => {
    if (!previewFile) return
    const file = previewFile
    setPreviewFile(null)
    setPreviewSrc(null)
    const saved = await api.sendImageMessage(params.id, file, caption.trim() || undefined)
    setMessages((m) => [...m, toUiMessage(saved, user.id)])
  }

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewFile(file)
    setPreviewSrc(URL.createObjectURL(file))
    e.target.value = ""
  }

  const statusLine = otherRecording
    ? "Recording a voice message..."
    : otherTyping
      ? "Typing..."
      : conversation.isGroup
        ? `${conversation.members?.length ?? 0} members`
        : conversation.online
          ? "Online"
          : "Last seen recently"

  return (
    <AppShell>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />

      {/* Header */}
      <header className="flex shrink-0 items-center gap-1 border-b border-border bg-card/80 px-2 py-2.5 backdrop-blur">
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link
          href={
            conversation.isGroup
              ? `/info/${conversation.id}`
              : `/users/${conversation.members?.find((m) => m.id !== String(user.id))?.id ?? ""}`
          }
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <UserAvatar
            src={conversation.avatar}
            name={conversation.name}
            online={conversation.online}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight text-foreground">
              {conversation.name}
            </p>
            <p
              className={
                otherTyping || otherRecording
                  ? "truncate text-xs font-medium text-primary"
                  : "truncate text-xs text-muted-foreground"
              }
            >
              {statusLine}
            </p>
          </div>
        </Link>
        <button
          aria-label="Voice call"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <Phone className="size-5" />
        </button>
        <button
          aria-label="Video call"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <Video className="size-5" />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={cn("flex-1 space-y-2.5 overflow-y-auto px-3 py-4", wallpaperClass)}
      >
        <div className="flex justify-center">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            Today
          </span>
        </div>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onExpandImage={setLightbox} />
        ))}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-bubble-received px-4 py-3 shadow-sm">
              <span className="flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex shrink-0 items-end gap-2 border-t border-border bg-card px-2.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <button
          aria-label="Attach photo"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-6" />
        </button>
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-3xl border border-input bg-background px-3.5 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              notifyTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault()
                sendText()
              }
            }}
            placeholder="Message"
            className="w-full bg-transparent text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            aria-label="Attach image"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImageIcon className="size-5" />
          </button>
        </div>
        {draft.trim() ? (
          <button
            aria-label="Send message"
            onClick={sendText}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-95"
          >
            <Send className="size-5" />
          </button>
        ) : (
          <button
            aria-label="Hold to record voice message"
            onClick={() => {
              setRecording(true)
              notifyRecording(true)
            }}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-95"
          >
            <Mic className="size-5" />
          </button>
        )}
      </div>

      {recording && (
        <RecordingOverlay
          onCancel={() => {
            setRecording(false)
            notifyRecording(false)
          }}
          onSend={sendVoice}
        />
      )}

      {previewSrc && (
        <ImagePreview src={previewSrc} onClose={() => { setPreviewSrc(null); setPreviewFile(null) }} onSend={sendImage} />
      )}

      {lightbox && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/95 p-4 backdrop-blur"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Close image"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full text-background hover:bg-background/10"
          >
            <X className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox || "/placeholder.svg"}
            alt="Expanded"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </AppShell>
  )
}
