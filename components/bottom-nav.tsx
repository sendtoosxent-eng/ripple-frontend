"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  MessageCircle,
  CircleDashed,
  Bell,
  UserRound,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { NavBackground } from "./nav-background"

const items = [
  {
    href: "/chats",
    label: "Chats",
    icon: MessageCircle,
  },
  {
    href: "/status",
    label: "Updates",
    icon: CircleDashed,
  },
  {
    href: "/notifications",
    label: "Alerts",
    icon: Bell,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
]

export function BottomNav() {
  const reduceMotion = useReducedMotion()
  const pathname = usePathname()
  const { user } = useAuth()

  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!user) return

    Promise.all([api.getFriendRequests(), api.getUnreadNotificationCount()])
      .then(([requests, notifications]) => setPendingCount(requests.length + Number(notifications.count || 0)))
      .catch(() => {})
  }, [user, pathname])

  const activeIndex = useMemo(() => {
    const index = items.findIndex(
      (i) =>
        pathname === i.href ||
        pathname.startsWith(i.href + "/")
    )

    return index === -1 ? 0 : index
  }, [pathname])

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div className="relative w-full max-w-md">

        <NavBackground
    activeIndex={activeIndex}
    totalItems={items.length}
/>

        <div className="relative flex h-20 items-center justify-around">

          {/* Floating Button */}

          <motion.div
            animate={{
              left: `${activeIndex * 20}%`,
            }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 28 }}
            className="absolute top-0 flex w-1/5 justify-center pointer-events-none"
          >
            <motion.div
              layout
              className="flex h-16 w-16 -translate-y-6 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/30 ring-8 ring-background"
            >
              {(() => {
                const ActiveIcon = items[activeIndex].icon

                return (
                  <ActiveIcon
                    className="h-7 w-7 text-primary-foreground"
                    strokeWidth={2.5}
                  />
                )
              })()}
            </motion.div>
          </motion.div>

          {items.map(({ href, label, icon: Icon }, index) => {
            const active = index === activeIndex

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative flex h-16 w-1/5 justify-center focus-visible:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <motion.div
                  whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                  className={cn(
                    "relative flex h-12 w-16 items-center justify-center transition-all",
                    active && "opacity-0"
                  )}
                >
                  <Icon
                    className="h-6 w-6 text-zinc-400"
                  />

                  {href === "/notifications" &&
                    pendingCount > 0 && (
                      <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {pendingCount > 9
                          ? "9+"
                          : pendingCount}
                      </span>
                    )}
                </motion.div>
                <span className={cn("absolute bottom-0 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
