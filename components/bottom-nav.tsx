"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  MessageCircle,
  Settings,
  UserRound,
  CircleDashed,
  Bell,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

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

  useEffect(() => {
    if (!user) return

    api
      .getFriendRequests()
      .then((reqs) => setPendingCount(reqs.length))
      .catch(() => {})
  }, [user, pathname])

  return (
    <nav className="sticky bottom-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-3xl px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="flex items-center justify-between">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-1"
            >
              <div
                className={cn(
                  "relative flex h-11 w-16 items-center justify-center rounded-full transition-all duration-300",
                  active
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-all duration-300",
                    active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />

                {href === "/notifications" && pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-[11px] transition-all duration-300",
                  active
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "font-medium text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}