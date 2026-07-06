"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, AtSign, Check, MessageCircle, UserPlus, Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

type PublicUser = {
  id: number
  name: string
  username: string
  avatar_url: string | null
  cover_photo_url: string | null
  bio: string | null
  status: string | null
  online: boolean
  friends_count: number
}

type FriendStatus = {
  status: "none" | "pending" | "accepted" | "rejected"
  request_id: number | null
  i_am_sender: boolean
  friends_count: number
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user: me, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [friendStatus, setFriendStatus] = useState<FriendStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const [friendBusy, setFriendBusy] = useState(false)

  useEffect(() => {
    if (!authLoading && !me) router.replace("/")
  }, [authLoading, me, router])

  useEffect(() => {
    if (!me) return
    api.getUser(params.id).then(setProfile)
    api.getFriendStatus(params.id).then(setFriendStatus)
  }, [params.id, me])

  async function messageThem() {
    if (!profile) return
    setStarting(true)
    try {
      const conversation = await api.createConversation({ member_ids: [profile.id] })
      router.push(`/chats/${conversation.id}`)
    } finally {
      setStarting(false)
    }
  }

  async function handleFriendAction() {
    if (!profile) return
    setFriendBusy(true)
    try {
      if (!friendStatus || friendStatus.status === "none" || friendStatus.status === "rejected") {
        await api.sendFriendRequest(profile.id)
        setFriendStatus({ status: "pending", request_id: null, i_am_sender: true, friends_count: friendStatus?.friends_count ?? 0 })
      } else if (friendStatus.status === "pending" && !friendStatus.i_am_sender && friendStatus.request_id) {
        await api.acceptFriendRequest(friendStatus.request_id)
        setFriendStatus({ ...friendStatus, status: "accepted" })
      }
    } finally {
      setFriendBusy(false)
    }
  }

  if (authLoading || !me || !profile) return null

  const isMe = profile.id === me.id

  const friendButtonLabel =
    !friendStatus || friendStatus.status === "none" || friendStatus.status === "rejected"
      ? "Add friend"
      : friendStatus.status === "pending"
        ? friendStatus.i_am_sender
          ? "Request sent"
          : "Accept request"
        : "Friends"

  const friendButtonIcon =
    friendStatus?.status === "accepted" ? <Check className="size-4" /> : <UserPlus className="size-4" />

  const friendButtonDisabled =
    friendBusy || (friendStatus?.status === "pending" && friendStatus.i_am_sender) || friendStatus?.status === "accepted"

  return (
    <AppShell>
      <header className="absolute left-2 top-4 z-10">
        <Link
          href="/chats"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-background"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="relative h-36 w-full bg-muted">
          {profile.cover_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.cover_photo_url} alt="Cover" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="-mt-10 flex flex-col items-center px-5 pt-4 text-center">
          <UserAvatar
            src={profile.avatar_url || "/avatars/you.png"}
            name={profile.name}
            online={profile.online}
            size="xl"
            className="ring-4 ring-background"
          />
          <h2 className="mt-4 text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <AtSign className="size-3.5" />
            {profile.username}
          </p>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            {friendStatus?.friends_count ?? profile.friends_count} friend
            {(friendStatus?.friends_count ?? profile.friends_count) === 1 ? "" : "s"}
          </p>

          {profile.status && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-online/15 px-3 py-1 text-xs font-medium text-online">
              <span className="size-2 rounded-full bg-online" />
              {profile.status}
            </span>
          )}

          {!isMe && (
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={messageThem}
                disabled={starting}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <MessageCircle className="size-4" />
                {starting ? "Starting..." : "Message"}
              </button>
              <button
                onClick={handleFriendAction}
                disabled={friendButtonDisabled}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                {friendButtonIcon}
                {friendButtonLabel}
              </button>
            </div>
          )}
        </div>

        <div className="px-5">
          <section className="mt-6 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">About</h3>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              {profile.bio || "No bio yet."}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
