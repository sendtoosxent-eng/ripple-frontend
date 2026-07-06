"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Send, Trash2, X } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

type StatusItem = {
  id: number
  type: "text" | "image"
  text: string | null
  media_url: string | null
  background: string | null
  created_at: string
  viewed_by_me: boolean
  view_count: number
}

type StatusGroup = {
  user: { id: number; name: string; username: string; avatar_url: string | null }
  statuses: StatusItem[]
}

const DURATION = 5000 // ms per status
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥"]

export default function StatusViewerPage() {
  const params = useParams<{ userId: string }>()
  const router = useRouter()
  const { user: me, loading: authLoading } = useAuth()
  const [group, setGroup] = useState<StatusGroup | null>(null)
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [sentFlash, setSentFlash] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)

  useEffect(() => {
    if (!authLoading && !me) router.replace("/")
  }, [authLoading, me, router])

  useEffect(() => {
    if (!me) return
    api.getStatuses().then((groups: StatusGroup[]) => {
      const found = groups.find((g) => String(g.user.id) === params.userId)
      if (!found) {
        router.replace("/status")
        return
      }
      setGroup(found)
    })
  }, [params.userId, me])

  const current = group?.statuses[index]
  const isMine = group?.user.id === me?.id

  // Mark viewed + run progress timer
  useEffect(() => {
    if (!current || !me) return
    if (!isMine) api.markStatusViewed(current.id).catch(() => {})

    elapsedRef.current = 0
    setProgress(0)
    startRef.current = performance.now()

    function tick(now: number) {
      if (paused) {
        startRef.current = now - elapsedRef.current
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      elapsedRef.current = now - startRef.current
      const pct = Math.min(elapsedRef.current / DURATION, 1)
      setProgress(pct)
      if (pct >= 1) {
        goNext()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.id, paused])

  function goNext() {
    if (!group) return
    if (index < group.statuses.length - 1) {
      setIndex((i) => i + 1)
    } else {
      router.push("/status")
    }
  }

  function goPrev() {
    if (index > 0) setIndex((i) => i - 1)
    else router.push("/status")
  }

  async function handleDelete() {
    if (!current) return
    if (!confirm("Delete this update?")) return
    await api.deleteStatus(current.id)
    if (group && group.statuses.length === 1) {
      router.push("/status")
    } else {
      goNext()
    }
  }

  async function sendReply(text: string) {
    if (!current || !text.trim() || sending) return
    setSending(true)
    setPaused(false)
    try {
      await api.replyToStatus(current.id, text.trim())
      setReplyText("")
      setSentFlash(true)
      setTimeout(() => setSentFlash(false), 1500)
    } finally {
      setSending(false)
    }
  }

  if (authLoading || !me || !group || !current) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Progress bars */}
      <div className="flex gap-1 px-2 pt-3">
        {group.statuses.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white"
              style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <UserAvatar src={group.user.avatar_url || "/avatars/you.png"} name={group.user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{isMine ? "My status" : group.user.name}</p>
          <p className="text-xs text-white/70">
            {new Date(current.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            {isMine && ` · ${current.view_count} view${current.view_count === 1 ? "" : "s"}`}
          </p>
        </div>
        {isMine && (
          <button onClick={handleDelete} aria-label="Delete" className="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
            <Trash2 className="size-4.5" />
          </button>
        )}
        <button
          onClick={() => router.push("/status")}
          aria-label="Close"
          className="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Content */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {current.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.media_url || "/placeholder.svg"} alt="Status" className="max-h-full max-w-full object-contain" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-8"
            style={{ backgroundColor: current.background || "#25D366" }}
          >
            <p className="text-pretty text-center text-2xl font-semibold text-white">{current.text}</p>
          </div>
        )}

        {sentFlash && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-black">
            Sent ✓
          </div>
        )}

        {/* Tap zones for prev/next — only over the top 80% so they don't block the reply bar below */}
        <button aria-label="Previous" onClick={goPrev} className="absolute inset-y-0 left-0 w-1/3" />
        <button aria-label="Next" onClick={goNext} className="absolute inset-y-0 right-0 w-1/3" />
      </div>

      {/* Reply / react bar — only for friends' statuses, not your own */}
      {!isMine && (
        <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mb-2 flex justify-center gap-3">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReply(emoji)}
                disabled={sending}
                className="text-2xl transition-transform active:scale-90 disabled:opacity-50"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 backdrop-blur">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendReply(replyText)
              }}
              placeholder={`Reply to ${group.user.name.split(" ")[0]}...`}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/60"
            />
            <button
              onClick={() => sendReply(replyText)}
              disabled={!replyText.trim() || sending}
              aria-label="Send reply"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
