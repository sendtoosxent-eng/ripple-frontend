"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft,
  BellOff,
  LogOut,
  Phone,
  Search,
  Star,
  Video,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { Switch } from "@/components/ui/switch"
import { getConversation, sharedMedia } from "@/lib/data"

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
  const conversation = getConversation(params.id)
  if (!conversation) notFound()

  const [muted, setMuted] = useState(conversation.muted ?? false)
  const [starred, setStarred] = useState(false)

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

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex flex-col items-center pt-2 text-center">
          <UserAvatar
            src={conversation.avatar}
            name={conversation.name}
            online={conversation.online}
            size="xl"
          />
          <h1 className="mt-4 text-xl font-bold text-foreground">{conversation.name}</h1>
          <p className="text-sm text-muted-foreground">
            {conversation.isGroup
              ? `Group · ${conversation.members?.length ?? 0} members`
              : conversation.online
                ? "Online"
                : "Last seen recently"}
          </p>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Action icon={<Phone className="size-5" />} label="Call" />
          <Action icon={<Video className="size-5" />} label="Video" />
          <Action icon={<Search className="size-5" />} label="Search" />
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <label className="flex cursor-pointer items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-sm font-medium text-foreground">
              <BellOff className="size-5 text-muted-foreground" />
              Mute notifications
            </span>
            <Switch checked={muted} onCheckedChange={setMuted} />
          </label>
          <div className="mx-4 h-px bg-border" />
          <label className="flex cursor-pointer items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-sm font-medium text-foreground">
              <Star className="size-5 text-muted-foreground" />
              Starred messages
            </span>
            <Switch checked={starred} onCheckedChange={setStarred} />
          </label>
        </section>

        {conversation.isGroup && conversation.members && (
          <section className="mt-5">
            <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">
              {conversation.members.length} members
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {conversation.members.map((m, i) => (
                <li key={m.id}>
                  {i > 0 && <div className="mx-4 h-px bg-border" />}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <UserAvatar src={m.avatar} name={m.name} online={m.online} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.username}</p>
                    </div>
                    {m.online && <span className="text-xs font-medium text-online">Active</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-foreground">Shared media</h2>
            <button className="text-xs font-medium text-primary hover:underline">See all</button>
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

        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20">
          <LogOut className="size-4" />
          {conversation.isGroup ? "Leave group" : "Block contact"}
        </button>
      </div>
    </AppShell>
  )
}
