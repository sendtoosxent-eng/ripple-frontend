"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  return (
    <AppShell>
      <div className="flex items-center justify-between px-5 pt-5">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-8">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Sign in to keep the conversation going.
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setSubmitting(true)
            try {
              await login(email, password)
              router.push("/chats")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Login failed")
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Email or username</span>
            <div className="flex h-12 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              <Mail className="size-5 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="osxent@ripple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Password</span>
            <div className="flex h-12 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              <Lock className="size-5 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
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

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded border-input accent-primary"
              />
              Remember me
            </label>
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-3">
          <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <span className="font-bold text-primary">G</span> Google
          </button>
          <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <span className="font-bold"></span> Apple
          </button>
        </div>
      </div>

      <p className="pb-8 pt-2 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AppShell>
  )
}
