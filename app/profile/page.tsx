"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AtSign, CircleDashed, Grid3X3, PencilLine, Settings, Sparkles } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

type ProfilePost = { id: number; image_url: string | null; user: { id: number } }

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [posts, setPosts] = useState<ProfilePost[]>([])

  useEffect(() => {
    if (!loading && !user) router.replace("/")
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    api.getPosts()
      .then((result) => setPosts((result.data || []).filter((post: ProfilePost) => post.user.id === user.id)))
      .catch(() => {})
  }, [user])

  if (loading || !user) return null
  const photoPosts = posts.filter((post) => post.image_url).slice(0, 6)

  return (
    <AppShell>
      <header className="flex shrink-0 items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <Link href="/settings" aria-label="Settings" className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground">
          <Settings className="size-5" />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/35 via-primary/15 to-muted">
          {user.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.cover_photo_url} alt="Profile cover" className="h-full w-full object-cover" />
          ) : (
            <Sparkles className="absolute right-8 top-7 size-10 text-primary/30" />
          )}
        </div>

        <div className="relative -mt-12 px-5">
          <div className="flex items-end justify-between gap-3">
            <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} online size="xl" className="ring-4 ring-background" />
            <Link href="/settings/edit-profile" className="mb-1 inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-background px-4 text-sm font-semibold text-primary hover:bg-primary/10">
              <PencilLine className="size-4" /> Edit profile
            </Link>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-foreground">{user.name}</h2>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <AtSign className="size-3.5" /> {user.username}
          </p>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-foreground/80">
            {user.bio || "Add a bio so your friends know a little more about you."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/posts" className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <p className="text-2xl font-bold text-foreground">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Posts shared</p>
            </Link>
            <Link href="/status/new" className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <CircleDashed className="size-5 text-primary" />
              <p className="mt-1 text-xs font-medium text-foreground">Add an update</p>
            </Link>
          </div>

          <section className="mt-4 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Current vibe</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{user.status || "No status set yet."}</p>
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Grid3X3 className="size-4 text-muted-foreground" /> Your posts
              </h3>
              <Link href="/posts" className="text-xs font-medium text-primary">View feed</Link>
            </div>
            {photoPosts.length ? (
              <div className="grid grid-cols-3 gap-1.5">
                {photoPosts.map((post) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={post.id} src={post.image_url || "/placeholder.svg"} alt="Your post" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">Your photo posts will appear here.</div>
            )}
          </section>
        </div>
      </div>

      <BottomNav />
    </AppShell>
  )
}
