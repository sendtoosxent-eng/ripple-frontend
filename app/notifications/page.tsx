"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Check, Heart, MessageSquare, Repeat2, Rss, UserPlus, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { getEcho } from "@/lib/echo"

type FriendRequestItem = {
  id: number
  sender: { id: number; name: string; username: string; avatar_url: string | null }
}

type NotificationItem = {
  id: number
  type: "post_liked" | "post_commented" | "post_reposted" | "new_post" | "friend_accepted"
  data: { actor_id: number; actor_name: string; actor_avatar: string | null; post_id?: number; preview?: string }
  created_at: string
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return "now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function NotificationRow({ n }: { n: NotificationItem }) {
  const icon =
    n.type === "post_liked" ? (
      <Heart className="size-4 text-destructive" />
    ) : n.type === "post_commented" ? (
      <MessageSquare className="size-4 text-primary" />
    ) : n.type === "post_reposted" ? (
      <Repeat2 className="size-4 text-emerald-600" />
    ) : n.type === "new_post" ? (
      <Rss className="size-4 text-primary" />
    ) : (
      <UserPlus className="size-4 text-emerald-600" />
    )

  const text =
    n.type === "post_liked"
      ? "liked your post"
      : n.type === "post_commented"
        ? `commented: "${n.data.preview}"`
        : n.type === "post_reposted"
          ? "reposted your post"
          : n.type === "new_post"
          ? `posted: "${n.data.preview}"`
          : "accepted your friend request"

  const href = n.type === "friend_accepted" ? `/users/${n.data.actor_id}` : "/posts"

  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted/60">
      <div className="relative">
        <UserAvatar src={n.data.actor_avatar || "/avatars/you.png"} name={n.data.actor_name} size="md" />
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-card shadow-sm">
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          <span className="font-semibold">{n.data.actor_name}</span> {text}
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
      </div>
    </Link>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState<FriendRequestItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  function refresh() {
    Promise.all([api.getFriendRequests(), api.getNotifications()])
      .then(([reqs, notifs]) => {
        setRequests(reqs)
        setNotifications(notifs)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) return
    refresh()

    const echo = getEcho()
    if (!echo) return
    const channel = echo.private(`user.${user.id}`)
    channel.listen(".friend-request.updated", () => refresh())
    channel.listen(".notification.created", () => refresh())

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
        ) : (
          <>
            {requests.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Friend requests
                </p>
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
              </>
            )}

            {notifications.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activity
                </p>
                <ul className="flex flex-col">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <NotificationRow n={n} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {requests.length === 0 && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-20 text-center text-sm text-muted-foreground">
                <UserPlus className="size-8 text-muted-foreground/50" />
                Nothing here yet.
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </AppShell>
  )
}
