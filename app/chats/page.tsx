"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { BellOff, ImageIcon, Mic, PenSquare, Search } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/user-avatar"
import { Logo } from "@/components/logo"
import type { Conversation } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { toUiConversation } from "@/lib/transform"
import { getEcho } from "@/lib/echo"
import { playNotificationSound } from "@/lib/sound"

function Preview({ c }: { c: Conversation }) {
  const icon =
    c.lastMessageType === "image" ? (
      <ImageIcon className="size-3.5" />
    ) : c.lastMessageType === "voice" ? (
      <Mic className="size-3.5" />
    ) : null
  return (
    <span className="flex items-center gap-1 truncate">
      {icon}
      <span className="truncate">{c.lastMessage}</span>
    </span>
  )
}

export default function ChatsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [query, setQuery] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getConversations()
      .then((data) => setConversations(data.map((c: any) => toUiConversation(c, user.id))))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load chats"))
      .finally(() => setLoading(false))
  }, [user])

  // Subscribe to every conversation's channel so the list updates live —
  // new last message, bumped to top, unread count, and a notification chime.
  useEffect(() => {
    if (!user || conversations.length === 0) return
    const echo = getEcho()
    if (!echo) return

    const channels = conversations.map((c) => {
      const channel = echo.private(`conversation.${c.id}`)
      channel.listen(".message.sent", (e: { message: any }) => {
        const isMine = e.message.sender_id === user.id
        const preview =
          e.message.type === "text" ? e.message.text || "" : e.message.type === "image" ? "Photo" : "Voice message"

        setConversations((prev) => {
          const idx = prev.findIndex((x) => x.id === c.id)
          if (idx === -1) return prev
          const updated = {
            ...prev[idx],
            lastMessage: preview,
            lastMessageType: e.message.type,
            time: new Date(e.message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            unread: isMine ? prev[idx].unread : prev[idx].unread + 1,
          }
          const rest = prev.filter((x) => x.id !== c.id)
          return [updated, ...rest]
        })

        if (!isMine) playNotificationSound()
      })
      return channel
    })

    return () => {
      conversations.forEach((c) => echo.leave(`conversation.${c.id}`))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversations.length])

  const filtered = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, conversations],
  )

  if (authLoading || !user) return null

  return (
    <AppShell>
      <header className="shrink-0 px-5 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo showName={false} />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chats</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/profile">
              <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="sm" />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex h-11 items-center gap-2.5 rounded-full border border-input bg-muted/60 px-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="size-4.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Loading chats…</p>
        ) : error ? (
          <p className="px-6 py-16 text-center text-sm text-destructive">{error}</p>
        ) : (
          <ul className="flex flex-col">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chats/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/60"
                >
                  <UserAvatar src={c.avatar} name={c.name} online={c.online} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-foreground">{c.name}</span>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          c.unread > 0 ? "font-semibold text-primary" : "text-muted-foreground",
                        )}
                      >
                        {c.time}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "min-w-0 text-sm",
                          c.unread > 0 ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <Preview c={c} />
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {c.muted && <BellOff className="size-3.5 text-muted-foreground" />}
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-6 py-16 text-center text-sm text-muted-foreground">
                {conversations.length === 0
                  ? "No conversations yet. Start one!"
                  : `No conversations found for "${query}".`}
              </li>
            )}
          </ul>
        )}

        <Link
          href="/chats/new"
          aria-label="New chat"
          className="sticky bottom-4 left-full mr-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-95"
        >
          <PenSquare className="size-6" />
        </Link>
      </div>

      <BottomNav />
    </AppShell>
  )
}
