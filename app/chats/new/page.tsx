"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Search, Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

type Friend = { id: number; name: string; username: string; avatar: string | null; avatar_url: string | null; online: boolean }

export default function NewChatPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<Friend[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [user])

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()),
  )

  async function startChat(friendId: number) {
    setStarting(friendId)
    try {
      const conversation = await api.createConversation({ member_ids: [friendId] })
      router.push(`/chats/${conversation.id}`)
    } finally {
      setStarting(null)
    }
  }

  if (authLoading || !user) return null

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-4 pt-5">
        <Link
          href="/chats"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">New chat</h1>
      </header>

      <div className="px-5 pt-4">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-input bg-muted/60 px-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="size-4.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-2 pt-3">
        <Link
          href="/chats/new-group"
          className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/60"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <span className="font-semibold text-foreground">New group</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Loading friends…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            {users.length === 0 ? "No other accounts yet — register a second account to test chatting." : "No matches."}
          </p>
        ) : (
          <ul className="flex flex-col">
            {filtered.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => startChat(u.id)}
                  disabled={starting !== null}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
                >
                  <UserAvatar src={u.avatar_url || "/avatars/you.png"} name={u.name} online={u.online} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">@{u.username}</p>
                  </div>
                  {starting === u.id && <span className="text-xs text-muted-foreground">Starting…</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
