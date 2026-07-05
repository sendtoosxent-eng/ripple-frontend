"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { ArrowLeft, Check, ImageIcon, Type } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const COLORS = ["#25D366", "#6366F1", "#F97316", "#EC4899", "#0EA5E9", "#111827"]

export default function NewStatusPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"text" | "image">("text")
  const [text, setText] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function post() {
    setError(null)
    if (mode === "text" && !text.trim()) {
      setError("Write something first.")
      return
    }
    if (mode === "image" && !imageFile) {
      setError("Pick a photo first.")
      return
    }
    setPosting(true)
    try {
      if (mode === "text") {
        await api.postTextStatus(text.trim(), color)
      } else if (imageFile) {
        await api.postImageStatus(imageFile)
      }
      router.push("/status")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post update")
    } finally {
      setPosting(false)
    }
  }

  return (
    <AppShell>
      <header className="flex shrink-0 items-center justify-between px-4 pt-5">
        <div className="flex items-center gap-2">
          <Link
            href="/status"
            aria-label="Cancel"
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">New update</h1>
        </div>
        <button
          onClick={post}
          disabled={posting}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Check className="size-4" />
          {posting ? "Posting..." : "Share"}
        </button>
      </header>

      <div className="flex shrink-0 gap-2 px-4 pt-4">
        <button
          onClick={() => setMode("text")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium",
            mode === "text" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Type className="size-4" /> Text
        </button>
        <button
          onClick={() => setMode("image")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium",
            mode === "image" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <ImageIcon className="size-4" /> Photo
        </button>
      </div>

      {error && (
        <p className="mx-4 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {mode === "text" ? (
          <>
            <div
              className="flex aspect-[3/4] w-full max-w-xs items-center justify-center rounded-3xl p-6 shadow-lg"
              style={{ backgroundColor: color }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your update..."
                rows={4}
                maxLength={500}
                className="w-full resize-none bg-transparent text-center text-2xl font-semibold text-white outline-none placeholder:text-white/60"
              />
            </div>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Background ${c}`}
                  className={cn("size-8 rounded-full ring-2 ring-offset-2 ring-offset-background", color === c ? "ring-foreground" : "ring-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[3/4] w-full max-w-xs items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted shadow-lg"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  Tap to choose a photo
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
