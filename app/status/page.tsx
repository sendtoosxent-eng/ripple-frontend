"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type StatusGroup = {
  user: { id: number; name: string; username: string; avatar_url: string | null }
  all_viewed: boolean
  statuses: { id: number; created_at: string }[]
}

export default function StatusFeedPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [groups, setGroups] = useState<StatusGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getStatuses()
      .then(setGroups)
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading || !user) return null

  const myGroup = groups.find((g) => g.user.id === user.id)
  const otherGroups = groups.filter((g) => g.user.id !== user.id)

  return (
    <AppShell>
      <header className="shrink-0 px-5 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Updates</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* My status */}
        <Link href={myGroup ? `/status/${user.id}` : "/status/new"} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted/60">
          <div className="relative">
            <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="md" />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <Plus className="size-3" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">My status</p>
            <p className="truncate text-sm text-muted-foreground">
              {myGroup ? `${myGroup.statuses.length} update${myGroup.statuses.length > 1 ? "s" : ""} · Tap to view` : "Tap to add an update"}
            </p>
          </div>
        </Link>

        {otherGroups.length > 0 && (
          <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent updates
          </p>
        )}

        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <ul className="flex flex-col">
            {otherGroups.map((g) => (
              <li key={g.user.id}>
                <Link href={`/status/${g.user.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted/60">
                  <span
                    className={cn(
                      "rounded-full p-0.5",
                      g.all_viewed ? "ring-2 ring-muted-foreground/30" : "ring-2 ring-primary",
                    )}
                  >
                    <UserAvatar src={g.user.avatar_url || "/avatars/you.png"} name={g.user.name} size="md" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{g.user.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {g.statuses.length} update{g.statuses.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {!loading && otherGroups.length === 0 && (
              <li className="px-6 py-16 text-center text-sm text-muted-foreground">
                No updates from friends yet — updates disappear after 24 hours.
              </li>
            )}
          </ul>
        )}

        <Link
          href="/status/new"
          aria-label="Add status"
          className="sticky bottom-4 left-full mr-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </Link>
      </div>

      <BottomNav />
    </AppShell>
  )
}
