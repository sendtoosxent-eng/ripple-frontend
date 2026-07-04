"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  ChevronRight,
  CircleHelp,
  Lock,
  LogOut,
  MessageSquareText,
  Moon,
  Palette,
  Vibrate,
  Volume2,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { UserAvatar } from "@/components/user-avatar"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"

function Row({
  icon,
  label,
  children,
  href,
}: {
  icon: React.ReactNode
  label: string
  children?: React.ReactNode
  href?: string
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {children ?? <ChevronRight className="size-4 text-muted-foreground" />}
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:bg-muted/60">
        {content}
      </Link>
    )
  }
  return content
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [push, setPush] = useState(true)
  const [sound, setSound] = useState(true)
  const [vibrate, setVibrate] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!loading && !user) router.replace("/")
  }, [loading, user, router])

  const isDark = mounted && resolvedTheme === "dark"

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    router.push("/")
  }

  if (loading || !user) return null

  return (
    <AppShell>
      <header className="shrink-0 px-5 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {/* Profile card */}
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted/60"
        >
          <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} online size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.status || `@${user.username}`}</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        {/* Appearance */}
        <h2 className="mb-2 mt-5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </h2>
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70">
              <Moon className="size-4.5" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">Dark mode</span>
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </label>
          <div className="mx-4 h-px bg-border" />
          <Row icon={<Palette className="size-4.5" />} label="Chat wallpaper" href="/settings/wallpaper" />
        </section>

        {/* Notifications */}
        <h2 className="mb-2 mt-5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Notifications
        </h2>
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70">
              <MessageSquareText className="size-4.5" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">Push notifications</span>
            <Switch checked={push} onCheckedChange={setPush} />
          </label>
          <div className="mx-4 h-px bg-border" />
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70">
              <Volume2 className="size-4.5" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">In-app sounds</span>
            <Switch checked={sound} onCheckedChange={setSound} />
          </label>
          <div className="mx-4 h-px bg-border" />
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70">
              <Vibrate className="size-4.5" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">Vibrate</span>
            <Switch checked={vibrate} onCheckedChange={setVibrate} />
          </label>
        </section>

        {/* Account */}
        <h2 className="mb-2 mt-5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <Row icon={<Lock className="size-4.5" />} label="Privacy & security" href="/settings" />
          <div className="mx-4 h-px bg-border" />
          <Row icon={<CircleHelp className="size-4.5" />} label="Help & support" href="/settings" />
        </section>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
        >
          <LogOut className="size-4" />
          {loggingOut ? "Logging out..." : "Log out"}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">Ripple · Version 1.0.0</p>
      </div>

      <BottomNav />
    </AppShell>
  )
}
