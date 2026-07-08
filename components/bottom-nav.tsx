"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
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
  const pathname = usePathname()
  const { user } = useAuth()

  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!user) return

    api
      .getFriendRequests()
      .then((r) => setPendingCount(r.length))
      .catch(() => {})
  }, [user])

  const activeIndex = useMemo(() => {
    const index = items.findIndex(
      (i) =>
        pathname === i.href ||
        pathname.startsWith(i.href + "/")
    )

    return index === -1 ? 0 : index
  }, [pathname])

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="relative w-full max-w-md">

        <NavBackground />

        <div className="relative flex h-20 items-center justify-around">

          {/* Floating Button */}

          <motion.div
            animate={{
              left: `${activeIndex * 20}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 28,
            }}
            className="absolute top-0 flex w-1/5 justify-center pointer-events-none"
          >
            <motion.div
              layout
              className="flex h-16 w-16 -translate-y-6 items-center justify-center rounded-full bg-lime-400 shadow-2xl ring-8 ring-background"
            >
              {(() => {
                const ActiveIcon = items[activeIndex].icon

                return (
                  <ActiveIcon
                    className="h-7 w-7 text-black"
                    strokeWidth={2.5}
                  />
                )
              })()}
            </motion.div>
          </motion.div>

          {items.map(({ href, icon: Icon }, index) => {
            const active = index === activeIndex

            return (
              <Link
                key={href}
                href={href}
                className="relative flex w-1/5 justify-center"
              >
                <motion.div
                  whileTap={{
                    scale: 0.9,
                  }}
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center transition-all",
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
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}