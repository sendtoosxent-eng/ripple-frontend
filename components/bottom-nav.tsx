"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, Settings, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/chats", label: "Chats", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="flex shrink-0 items-stretch border-t border-border bg-card/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
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
            <Icon className={cn("size-6", active && "fill-primary/15")} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
