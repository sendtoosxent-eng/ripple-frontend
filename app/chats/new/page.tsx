"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, ChevronRight, MessageCircle, Search, UserPlus, Users } from "lucide-react"
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
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    Promise.all([api.getUsers(), api.getFriends()])
      .then(([people, friends]) => {
        setUsers(people)
        setFriendIds(new Set(friends.map((friend: Friend) => friend.id)))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "People could not be loaded."))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()),
  )

  async function startChat(friendId: number) {
    setError(null)
    setStarting(friendId)
    try {
      const conversation = await api.createConversation({ member_ids: [friendId] })
      router.push(`/chats/${conversation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "The conversation could not be started.")
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
            placeholder="Find people"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && <p role="alert" className="mx-5 mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

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
                <div className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/60">
                  <UserAvatar src={u.avatar_url || "/avatars/you.png"} name={u.name} online={u.online} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">@{u.username}</p>
                  </div>
                  {friendIds.has(u.id) ? (
                    <button aria-label={`Message ${u.name}`} onClick={() => startChat(u.id)} disabled={starting !== null} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                      <MessageCircle className="size-3.5" />{starting === u.id ? "Starting…" : "Message"}
                    </button>
                  ) : (
                    <Link href={`/users/${u.id}?from=new-chat`} aria-label={`View ${u.name}'s profile and add them as a friend`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted">
                      <UserPlus className="size-3.5" /> Profile <ChevronRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
