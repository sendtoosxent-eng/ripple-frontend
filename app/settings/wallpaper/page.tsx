"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { WALLPAPERS, getWallpaper, setWallpaper, type WallpaperId } from "@/lib/wallpaper"
import { cn } from "@/lib/utils"

export default function WallpaperPage() {
  const [selected, setSelected] = useState<WallpaperId>("default")

  useEffect(() => setSelected(getWallpaper()), [])

  function choose(id: WallpaperId) {
    setWallpaper(id)
    setSelected(id)
  }

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-4 pt-5">
        <Link
          href="/settings"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Chat wallpaper</h1>
      </header>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5">
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            onClick={() => choose(w.id)}
            className={cn(
              "relative flex h-28 items-end justify-center rounded-2xl border-2 p-3 transition-colors",
              w.className,
              selected === w.id ? "border-primary" : "border-transparent",
            )}
          >
            <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
              {w.label}
            </span>
            {selected === w.id && (
              <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" />
              </span>
            )}
          </button>
        ))}
      </div>
    </AppShell>
  )
}
