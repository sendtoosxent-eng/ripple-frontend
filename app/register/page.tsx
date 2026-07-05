"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { ArrowLeft, AtSign, Camera, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"

function Field({
  label,
  icon,
  ...props
}: {
  label: string
  icon: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
        <span className="text-muted-foreground">{icon}</span>
        <input
          {...props}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </label>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-4 pt-5">
        <Link
          href="/"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Create account</h1>
      </header>

      <form
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-8 pt-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)

          if (password !== confirmPassword) {
            setError("Passwords don't match")
            return
          }

          setSubmitting(true)
          try {
            await register(
              { name, username, email, password, password_confirmation: confirmPassword },
              avatarFile,
            )
            router.push("/chats")
          } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed")
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative size-24 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted"
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo || "/placeholder.svg"} alt="Profile preview" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-muted-foreground">
                <User className="size-9" />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-primary/90 py-1 text-[10px] font-semibold text-primary-foreground">
              <Camera className="size-3" /> Add
            </span>
          </button>
          <p className="text-xs text-muted-foreground">Add a profile photo</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setPhoto(URL.createObjectURL(file))
                setAvatarFile(file)
              }
            }}
          />
        </div>

        <Field
          label="Full name"
          icon={<User className="size-5" />}
          placeholder="Osxent Musisi"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Username"
          icon={<AtSign className="size-5" />}
          placeholder="osxent"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
        />
        <Field
          label="Email"
          icon={<Mail className="size-5" />}
          type="email"
          placeholder="osxent@ripple.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Password</span>
          <div className="flex h-12 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
            <Lock className="size-5 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((s) => !s)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </label>

        <Field
          label="Confirm password"
          icon={<Lock className="size-5" />}
          type={showPw ? "text" : "password"}
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>

            <div>
               <Footer />
            </div>
    </AppShell>
  )
}
