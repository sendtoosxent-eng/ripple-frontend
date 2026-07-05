"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Camera, Check, Search, Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type Friend = { id: number; name: string; username: string; avatar_url: string | null; online: boolean }

export default function NewGroupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<Friend[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [groupName, setGroupName] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [user])

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()),
  )

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function createGroup() {
    setError(null)
    if (selected.length < 2) {
      setError("Pick at least 2 friends for a group.")
      return
    }
    if (!groupName.trim()) {
      setError("Give your group a name.")
      return
    }
    setCreating(true)
    try {
      const conversation = await api.createConversation(
        { member_ids: selected, is_group: true, name: groupName.trim() },
        photoFile,
      )
      router.push(`/chats/${conversation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group")
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-4 pt-5">
        <Link
          href="/chats/new"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">New group</h1>
      </header>

      <div className="flex items-center gap-3 px-5 pt-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setPhotoPreview(URL.createObjectURL(file))
              setPhotoFile(file)
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Group" className="h-full w-full object-cover" />
          ) : (
            <Users className="size-6 text-muted-foreground" />
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-primary/90 py-0.5">
            <Camera className="size-3 text-primary-foreground" />
          </span>
        </button>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name"
          className="h-12 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground"
        />
      </div>

      {error && (
        <p className="mx-5 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="px-5 pt-4">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-input bg-muted/60 px-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="size-4.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {selected.length > 0 && (
        <p className="px-5 pt-2 text-xs font-medium text-muted-foreground">{selected.length} selected</p>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Loading friends…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">No matches.</p>
        ) : (
          <ul className="flex flex-col">
            {filtered.map((u) => {
              const isSelected = selected.includes(u.id)
              return (
                <li key={u.id}>
                  <button
                    onClick={() => toggle(u.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <UserAvatar src={u.avatar_url || "/avatars/you.png"} name={u.name} online={u.online} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{u.name}</p>
                      <p className="truncate text-sm text-muted-foreground">@{u.username}</p>
                    </div>
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={createGroup}
          disabled={creating}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create group"}
        </button>
      </div>
    </AppShell>
  )
}
