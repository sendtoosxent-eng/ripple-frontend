"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, AtSign, Check, Grid3X3, MessageCircle, Repeat2, Sparkles, UserPlus, UsersRound } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

type PublicUser = {
  id: number; name: string; username: string; avatar_url: string | null; cover_photo_url: string | null
  bio: string | null; status: string | null; online: boolean; friends_count: number; posts_count: number; reshared_count: number
}
type FriendStatus = { status: "none" | "pending" | "accepted" | "rejected"; request_id: number | null; i_am_sender: boolean; friends_count: number }
type ProfilePost = { id: number; image_url: string | null; user: { id: number } }

export default function UserProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user: me, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [friendStatus, setFriendStatus] = useState<FriendStatus | null>(null)
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [hasActiveStatus, setHasActiveStatus] = useState(false)
  const [starting, setStarting] = useState(false)
  const [friendBusy, setFriendBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (!authLoading && !me) router.replace("/") }, [authLoading, me, router])
  useEffect(() => {
    if (!me) return
    Promise.all([api.getUser(params.id), api.getFriendStatus(params.id), api.getPosts(), api.getStatuses()])
      .then(([person, relationship, feed, statuses]) => {
        setProfile(person)
        setFriendStatus(relationship)
        setPosts((feed.data || []).filter((post: ProfilePost) => String(post.user.id) === params.id))
        setHasActiveStatus(statuses.some((group: { user: { id: number } }) => String(group.user.id) === params.id))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "This profile could not be loaded."))
  }, [params.id, me])

  useEffect(() => {
    if (profile && me && profile.id === me.id) router.replace("/profile")
  }, [profile, me, router])

  async function messageThem() {
    if (!profile || friendStatus?.status !== "accepted") return
    setStarting(true); setError(null)
    try {
      const conversation = await api.createConversation({ member_ids: [profile.id] })
      router.push(`/chats/${conversation.id}`)
    } catch (err) { setError(err instanceof Error ? err.message : "The conversation could not be started.") }
    finally { setStarting(false) }
  }

  async function handleFriendAction() {
    if (!profile) return
    setFriendBusy(true); setError(null)
    try {
      if (!friendStatus || friendStatus.status === "none" || friendStatus.status === "rejected") {
        await api.sendFriendRequest(profile.id)
        setFriendStatus({ status: "pending", request_id: null, i_am_sender: true, friends_count: friendStatus?.friends_count ?? profile.friends_count })
      } else if (friendStatus.status === "pending" && !friendStatus.i_am_sender && friendStatus.request_id) {
        await api.acceptFriendRequest(friendStatus.request_id)
        setFriendStatus({ ...friendStatus, status: "accepted", friends_count: friendStatus.friends_count + 1 })
      }
    } catch (err) { setError(err instanceof Error ? err.message : "The friend request could not be updated.") }
    finally { setFriendBusy(false) }
  }

  if (authLoading || !me || !profile) return null
  if (profile.id === me.id) return null

  const count = friendStatus?.friends_count ?? profile.friends_count
  const friendLabel = !friendStatus || friendStatus.status === "none" || friendStatus.status === "rejected" ? "Add friend" : friendStatus.status === "pending" ? friendStatus.i_am_sender ? "Request sent" : "Accept request" : "Friends"
  const friendDisabled = friendBusy || (friendStatus?.status === "pending" && friendStatus.i_am_sender) || friendStatus?.status === "accepted"
  const photoPosts = posts.filter((post) => post.image_url).slice(0, 6)

  return (
    <AppShell>
      <header className="absolute left-3 top-4 z-20">
        <button onClick={() => router.back()} aria-label="Back" className="inline-flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur hover:bg-background"><ArrowLeft className="size-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/35 via-primary/15 to-muted">
          {profile.cover_photo_url ? <img src={profile.cover_photo_url} alt="Profile cover" className="h-full w-full object-cover" /> : <Sparkles className="absolute right-8 top-7 size-10 text-primary/30" />}
        </div>

        <div className="relative -mt-14 px-5 text-center">
          <div className="flex justify-center">
            <Link href={hasActiveStatus ? `/status/${profile.id}` : `#profile-${profile.id}`} aria-label={hasActiveStatus ? `View ${profile.name}'s status` : `${profile.name} has no active status`} className={hasActiveStatus ? "relative rounded-full p-1 ring-3 ring-primary ring-offset-4 ring-offset-background" : "relative rounded-full p-1 ring-2 ring-border ring-offset-4 ring-offset-background"}>
              <UserAvatar src={profile.avatar_url || "/avatars/you.png"} name={profile.name} online={profile.online} size="xl" className="rounded-full ring-2 ring-background" />
            </Link>
          </div>
          <h1 id={`profile-${profile.id}`} className="mt-5 text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground"><AtSign className="size-3.5" /> {profile.username}</p>
          <p className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-foreground/80">{profile.bio || "No bio added yet."}</p>

          <div className="mt-5 flex justify-center gap-2.5">
            <button onClick={messageThem} disabled={starting || friendStatus?.status !== "accepted"} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 disabled:opacity-50"><MessageCircle className="size-4" />{starting ? "Starting…" : "Message"}</button>
            <button onClick={handleFriendAction} disabled={friendDisabled} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">{friendStatus?.status === "accepted" ? <Check className="size-4" /> : <UserPlus className="size-4" />}{friendLabel}</button>
          </div>
          {friendStatus?.status !== "accepted" && <p className="mx-auto mt-3 max-w-xs text-xs text-muted-foreground">Become friends to start a private conversation and view updates.</p>}
          {error && <p role="alert" className="mx-auto mt-3 max-w-xs rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-r border-border px-2 py-3.5"><UsersRound className="mx-auto size-4 text-primary" /><p className="mt-1 text-lg font-bold">{count}</p><p className="text-[11px] text-muted-foreground">Friends</p></div>
            <div className="border-r border-border px-2 py-3.5"><Grid3X3 className="mx-auto size-4 text-primary" /><p className="mt-1 text-lg font-bold">{profile.posts_count ?? posts.length}</p><p className="text-[11px] text-muted-foreground">Posts</p></div>
            <div className="px-2 py-3.5"><Repeat2 className="mx-auto size-4 text-primary" /><p className="mt-1 text-lg font-bold">{profile.reshared_count ?? 0}</p><p className="text-[11px] text-muted-foreground">Reshared</p></div>
          </div>

          <section className="mt-4 rounded-2xl border border-border bg-card p-4"><h2 className="text-sm font-semibold text-foreground">Current vibe</h2><p className="mt-1.5 text-sm text-muted-foreground">{profile.status || "No status set yet."}</p></section>
          <section className="mt-5 text-left">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Grid3X3 className="size-4 text-muted-foreground" /> Recent posts</h2>
            {photoPosts.length ? <div className="grid grid-cols-3 gap-1.5">{photoPosts.map((post) => <img key={post.id} src={post.image_url || "/placeholder.svg"} alt={`Post by ${profile.name}`} className="aspect-square w-full rounded-xl object-cover" />)}</div> : <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">No photo posts yet.</div>}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
