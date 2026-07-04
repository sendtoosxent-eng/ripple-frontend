"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AtSign, Bell, Image as ImageIcon, PencilLine, QrCode } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { UserAvatar } from "@/components/user-avatar"
import { sharedMedia } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace("/")
  }, [loading, user, router])

  if (loading || !user) return null

  return (
    <AppShell>
      <header className="flex shrink-0 items-center justify-between px-5 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <button
          aria-label="Show QR code"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <QrCode className="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="relative -mt-[1px] h-32 w-full bg-muted">
          {user.cover_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.cover_photo_url} alt="Cover" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col items-center px-5 pt-4 text-center -mt-10">
          <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} online size="xl" className="ring-4 ring-background" />
          <h2 className="mt-4 text-xl font-bold text-foreground">{user.name}</h2>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <AtSign className="size-3.5" />
            {user.username}
          </p>
          {user.status && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-online/15 px-3 py-1 text-xs font-medium text-online">
              <span className="size-2 rounded-full bg-online" />
              {user.status}
            </span>
          )}

          <Link
            href="/settings/edit-profile"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-[0.98]"
          >
            <PencilLine className="size-4" />
            Edit profile
          </Link>
        </div>

        <div className="px-5">
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">About</h3>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
            {user.bio || "No bio yet — add one from Edit profile."}
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AtSign className="size-4 text-muted-foreground" /> Username
            </span>
            <span className="text-sm text-muted-foreground">@{user.username}</span>
          </div>
          <div className="mx-4 h-px bg-border" />
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="size-4 text-muted-foreground" /> Notifications
            </span>
            <span className="text-sm text-muted-foreground">On</span>
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ImageIcon className="size-4 text-muted-foreground" /> Media
            </h3>
            <span className="text-xs text-muted-foreground">{sharedMedia.length} photos</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {sharedMedia.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src || "/placeholder.svg"}
                alt="Shared media"
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
        </div>
      </div>

      <BottomNav />
    </AppShell>
  )
}
