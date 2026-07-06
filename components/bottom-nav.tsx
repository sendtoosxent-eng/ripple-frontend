"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { MessageCircle, Settings, UserRound, CircleDashed, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { getEcho } from "@/lib/echo"

const items = [
  { href: "/chats", label: "Chats", icon: MessageCircle },
  { href: "/status", label: "Updates", icon: CircleDashed },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadChats, setUnreadChats] = useState(0)

  useEffect(() => {
    if (!user) return
    Promise.all([api.getFriendRequests(), api.getUnreadNotificationCount()])
      .then(([reqs, unread]) => setPendingCount(reqs.length + unread.count))
      .catch(() => {})
    api
      .getConversations()
      .then((convos: any[]) => setUnreadChats(convos.reduce((sum, c) => sum + (c.unread || 0), 0)))
      .catch(() => {})
  }, [user, pathname])

  // Live updates — badges bump instantly on new notifications/friend requests,
  // not just when you happen to navigate between tabs.
  useEffect(() => {
    if (!user) return
    const echo = getEcho()
    if (!echo) return

    const channel = echo.private(`user.${user.id}`)
    const refreshAlerts = () => {
      Promise.all([api.getFriendRequests(), api.getUnreadNotificationCount()])
        .then(([reqs, unread]) => setPendingCount(reqs.length + unread.count))
        .catch(() => {})
    }
    channel.listen(".friend-request.updated", refreshAlerts)
    channel.listen(".notification.created", refreshAlerts)

    return () => echo.leave(`user.${user.id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <nav className="flex shrink-0 items-stretch border-t border-border bg-card/80 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="relative">
              <Icon className={cn("size-6", active && "fill-primary/15")} />
              {href === "/notifications" && pendingCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
              {href === "/chats" && unreadChats > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
