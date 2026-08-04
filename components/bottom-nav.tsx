"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { CircleDashed, MessageCircle, Settings, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

function RipplePostIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      <path d="M5 18.5c3.2-5.9 6.6-8.9 10.2-8.9 2.8 0 5.4 1.7 7.8 5.1" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M6.5 22c2.4-3.7 5.1-5.6 8-5.6 2.3 0 4.5 1.1 6.5 3.4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity=".75" />
      <path d="m19.5 5 .65 1.85L22 7.5l-1.85.65L19.5 10l-.65-1.85L17 7.5l1.85-.65L19.5 5Z" fill="currentColor" />
      <circle cx="6" cy="11" r="2" fill="currentColor" />
    </svg>
  )
}

const items = [
  { href: "/chats", label: "Chats", icon: MessageCircle },
  { href: "/status", label: "Updates", icon: CircleDashed },
  { href: "/posts", label: "Posts", icon: RipplePostIcon, featured: true },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-3">
      <div className="flex h-16 w-full max-w-md items-center justify-around rounded-[1.6rem] border border-border/80 bg-card/95 px-1.5 shadow-[0_10px_35px_rgba(0,0,0,.16)] backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon, featured }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="relative flex h-12 w-1/5 items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <motion.span whileTap={reduceMotion ? undefined : { scale: 0.88 }} className={cn(
                "relative flex items-center justify-center transition-colors",
                featured ? "size-12 -translate-y-2 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background" : "size-10 rounded-xl",
                !featured && active ? "bg-primary/12 text-primary" : !featured ? "text-muted-foreground" : "",
              )}>
                <Icon className={featured ? "size-7" : "size-5.5"} />
                {active && !featured && <motion.span layoutId="nav-dot" className="absolute -bottom-1 size-1 rounded-full bg-primary" />}
              </motion.span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
