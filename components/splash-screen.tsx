"use client"

import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 900)
    const hideTimer = setTimeout(() => setVisible(false), 1200)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background transition-opacity duration-300 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-pulse">
        <Logo showName={false} />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">Ripple</span>
      <span className="text-xs text-muted-foreground">Messaging, made friendly</span>
    </div>
  )
}
