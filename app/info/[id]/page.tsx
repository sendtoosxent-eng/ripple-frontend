"use client"

import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  BellOff,
  LogOut,
  Phone,
  Users,
  Video,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { toUiConversation } from "@/lib/transform"
import type { Conversation } from "@/lib/data"

function Action({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card py-3 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-muted">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </span>
      {label}
    </button>
  )
}

export default function InfoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [notFoundFlag, setNotFoundFlag] = useState(false)
  const [muted, setMuted] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getConversation(params.id)
      .then((data) => {
        const ui = toUiConversation(data, user.id)
        setConversation(ui)
        setMuted(ui.muted ?? false)
      })
      .catch(() => setNotFoundFlag(true))
  }, [params.id, user])

  if (notFoundFlag) notFound()
  if (authLoading || !user || !conversation) return null

  async function toggleMuted() {
    setMuted((m) => !m)
    try {
      await api.toggleMute(params.id)
    } catch {
      setMuted((m) => !m) // revert on failure
    }
  }

  async function leaveGroup() {
    if (!confirm(`Leave "${conversation!.name}"? You won't receive messages from this chat anymore.`)) return
    setLeaving(true)
    try {
      await api.leaveConversation(params.id)
      router.push("/chats")
    } finally {
      setLeaving(false)
    }
  }

  const onlineCount = conversation.members?.filter((m) => m.online).length ?? 0

  return (
    <AppShell>
      <header className="flex shrink-0 items-center gap-1 px-2 py-2.5">
        <Link
          href={`/chats/${conversation.id}`}
          aria-label="Back"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="text-sm font-medium text-muted-foreground">
          {conversation.isGroup ? "Group info" : "Contact info"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex flex-col items-center pt-2 text-center">
          <UserAvatar src={conversation.avatar} name={conversation.name} size="xl" />
          <h2 className="mt-4 text-xl font-bold text-foreground">{conversation.name}</h2>
          {conversation.isGroup ? (
            <p className="text-sm text-muted-foreground">
              {conversation.members?.length ?? 0} members{onlineCount > 0 ? ` · ${onlineCount} online` : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{conversation.online ? "Online" : "Last seen recently"}</p>
          )}
        </div>

        <div className="mt-5 flex gap-2.5">
          <Action icon={<Phone className="size-4.5" />} label="Call" />
          <Action icon={<Video className="size-4.5" />} label="Video" />
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70">
              <BellOff className="size-4.5" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">Mute notifications</span>
            <Switch checked={muted} onCheckedChange={toggleMuted} />
          </label>
        </section>

        {conversation.isGroup && conversation.members && (
          <section className="mt-5">
            <h3 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
              <Users className="size-4 text-muted-foreground" />
              {conversation.members.length} members
            </h3>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {conversation.members.map((m, i) => (
                <div key={m.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <UserAvatar src={m.avatar} name={m.name} online={m.online} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.name} {String(m.id) === String(user.id) && <span className="text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.username}</p>
                    </div>
                    {m.online && <span className="size-2 rounded-full bg-online" />}
                  </div>
                  {i < conversation.members!.length - 1 && <div className="mx-4 h-px bg-border" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {conversation.isGroup && (
          <button
            onClick={leaveGroup}
            disabled={leaving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {leaving ? "Leaving..." : "Leave group"}
          </button>
        )}
      </div>
    </AppShell>
  )
}
