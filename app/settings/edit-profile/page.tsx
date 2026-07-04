"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, AtSign, Camera, User } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground"
      />
    </label>
  )
}

export default function EditProfilePage() {
  const router = useRouter()
  const { user, loading, refreshUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [status, setStatus] = useState("")
  const [bio, setBio] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/")
  }, [loading, user, router])

  useEffect(() => {
    if (user) {
      setName(user.name)
      setUsername(user.username)
      setStatus(user.status || "")
      setBio(user.bio || "")
    }
  }, [user])

  if (loading || !user) return null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api.updateProfile({ name, username, status, bio }, avatarFile, coverFile)
      await refreshUser()
      router.push("/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-4 pt-5">
        <Link
          href="/settings"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Edit profile</h1>
      </header>

      <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-8 pt-4">
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <input
          ref={coverFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setCoverPreview(URL.createObjectURL(file))
              setCoverFile(file)
            }
          }}
        />
        <button
          type="button"
          onClick={() => coverFileRef.current?.click()}
          className="relative -mx-6 h-32 shrink-0 overflow-hidden bg-muted"
        >
          {(coverPreview || user.cover_photo_url) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPreview || user.cover_photo_url || ""}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/60 py-1.5 text-xs font-semibold text-background">
            <Camera className="size-3.5" /> {user.cover_photo_url || coverPreview ? "Change cover photo" : "Add a cover photo"}
          </span>
        </button>

        <div className="flex flex-col items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative size-24 overflow-hidden rounded-full"
          >
            <UserAvatar src={avatarPreview || user.avatar_url || "/avatars/you.png"} name={user.name} size="xl" />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-primary/90 py-1 text-[10px] font-semibold text-primary-foreground">
              <Camera className="size-3" /> Change
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setAvatarPreview(URL.createObjectURL(file))
                setAvatarFile(file)
              }
            }}
          />
        </div>

        <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
          required
        />
        <Field label="Status" placeholder="e.g. Building cool things" value={status} onChange={(e) => setStatus(e.target.value)} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell people a bit about yourself"
            className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </AppShell>
  )
}
