"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Check, UserPlus, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { getEcho } from "@/lib/echo"

type FriendRequestItem = {
  id: number
  sender: { id: number; name: string; username: string; avatar_url: string | null }
  status: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState<FriendRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  function refresh() {
    api
      .getFriendRequests()
      .then(setRequests)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) return
    refresh()

    const echo = getEcho()
    if (!echo) return
    const channel = echo.private(`user.${user.id}`)
    channel.listen(".friend-request.updated", () => refresh())

    return () => echo.leave(`user.${user.id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function accept(id: number) {
    setBusyId(id)
    try {
      await api.acceptFriendRequest(id)
      setRequests((r) => r.filter((req) => req.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  async function reject(id: number) {
    setBusyId(id)
    try {
      await api.rejectFriendRequest(id)
      setRequests((r) => r.filter((req) => req.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || !user) return null

  return (
    <AppShell>
      <header className="shrink-0 px-5 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-20 text-center text-sm text-muted-foreground">
            <UserPlus className="size-8 text-muted-foreground/50" />
            No friend requests right now.
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                <UserAvatar src={r.sender.avatar_url || "/avatars/you.png"} name={r.sender.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{r.sender.name}</p>
                  <p className="truncate text-sm text-muted-foreground">wants to be friends · @{r.sender.username}</p>
                </div>
                <button
                  onClick={() => accept(r.id)}
                  disabled={busyId === r.id}
                  aria-label="Accept"
                  className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
                >
                  <Check className="size-4.5" />
                </button>
                <button
                  onClick={() => reject(r.id)}
                  disabled={busyId === r.id}
                  aria-label="Decline"
                  className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground disabled:opacity-60"
                >
                  <X className="size-4.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNav />
    </AppShell>
  )
}
