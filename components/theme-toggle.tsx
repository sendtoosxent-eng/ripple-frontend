"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {mounted && isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </button>
  )
}
