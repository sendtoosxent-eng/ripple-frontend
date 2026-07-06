"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type StatusGroup = {
  user: { id: number; name: string; username: string; avatar_url: string | null }
  all_viewed: boolean
  statuses: { id: number }[]
}

export function StoryCircles() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<StatusGroup[]>([])

  useEffect(() => {
    if (!user) return
    api.getStatuses().then(setGroups).catch(() => {})
  }, [user])

  if (!user) return null

  const myGroup = groups.find((g) => g.user.id === user.id)
  const otherGroups = groups.filter((g) => g.user.id !== user.id)

  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link href={myGroup ? `/status/${user.id}` : "/status/new"} className="flex shrink-0 flex-col items-center gap-1">
        <div className="relative">
          <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
            <Plus className="size-2.5" />
          </span>
        </div>
        <span className="max-w-14 truncate text-[0.65rem] text-muted-foreground">Your story</span>
      </Link>

      {otherGroups.map((g) => (
        <Link key={g.user.id} href={`/status/${g.user.id}`} className="flex shrink-0 flex-col items-center gap-1">
          <span className={cn("rounded-full p-0.5", g.all_viewed ? "ring-2 ring-muted-foreground/30" : "ring-2 ring-primary")}>
            <UserAvatar src={g.user.avatar_url || "/avatars/you.png"} name={g.user.name} size="md" />
          </span>
          <span className="max-w-14 truncate text-[0.65rem] text-muted-foreground">{g.user.name.split(" ")[0]}</span>
        </Link>
      ))}
    </div>
  )
}
