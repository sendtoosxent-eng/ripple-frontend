"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AtSign, Grid3X3, PencilLine, Plus, Repeat2, Settings, Sparkles, UsersRound } from "lucide-react"
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
  const [hasActiveStatus, setHasActiveStatus] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/")
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    Promise.all([api.getPosts(), api.getStatuses()])
      .then(([result, statuses]) => {
        setPosts((result.data || []).filter((post: ProfilePost) => post.user.id === user.id))
        setHasActiveStatus(statuses.some((group: { user: { id: number } }) => group.user.id === user.id))
      })
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

        <div className="relative -mt-14 px-5 text-center">
          <div className="flex justify-center">
            <Link href={hasActiveStatus ? `/status/${user.id}` : "/status/new"} aria-label={hasActiveStatus ? "View your status" : "Add a status"} className="group relative rounded-full p-1 ring-3 ring-primary ring-offset-4 ring-offset-background">
              <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="xl" className="rounded-full ring-2 ring-background" />
              {!hasActiveStatus && (
                <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-background">
                  <Plus className="size-4" />
                </span>
              )}
            </Link>
          </div>

          <h2 className="mt-5 text-2xl font-bold text-foreground">{user.name}</h2>
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <AtSign className="size-3.5" /> {user.username}
          </p>
          <p className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-foreground/80">
            {user.bio || "Add a bio so your friends know a little more about you."}
          </p>

          <Link href="/settings/edit-profile" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-background px-5 text-sm font-semibold text-primary hover:bg-primary/10">
            <PencilLine className="size-4" /> Edit profile
          </Link>

          <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card text-center">
            <div className="border-r border-border px-2 py-3.5">
              <UsersRound className="mx-auto size-4 text-primary" />
              <p className="mt-1 text-lg font-bold text-foreground">{user.friends_count ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Friends</p>
            </div>
            <Link href="/posts" className="border-r border-border px-2 py-3.5 hover:bg-primary/5">
              <Grid3X3 className="mx-auto size-4 text-primary" />
              <p className="mt-1 text-lg font-bold text-foreground">{user.posts_count ?? posts.length}</p>
              <p className="text-[11px] text-muted-foreground">Posts</p>
            </Link>
            <Link href="/posts" className="px-2 py-3.5 hover:bg-primary/5">
              <Repeat2 className="mx-auto size-4 text-primary" />
              <p className="mt-1 text-lg font-bold text-foreground">{user.reshared_count ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Reshared</p>
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
