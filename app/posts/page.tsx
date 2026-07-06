"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Heart, ImageIcon, Send, Trash2, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type PostItem = {
  id: number
  text: string | null
  image_url: string | null
  created_at: string
  likes_count: number
  liked_by_me: boolean
  user: { id: number; name: string; username: string; avatar_url: string | null }
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return "now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getPosts()
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false))
  }, [user])

  async function submitPost() {
    if (!text.trim() && !imageFile) return
    setPosting(true)
    try {
      const newPost = await api.createPost(text.trim(), imageFile)
      setPosts((p) => [{ ...newPost, likes_count: 0, liked_by_me: false }, ...p])
      setText("")
      setImageFile(null)
      setImagePreview(null)
    } finally {
      setPosting(false)
    }
  }

  async function toggleLike(post: PostItem) {
    setPosts((p) =>
      p.map((x) =>
        x.id === post.id
          ? { ...x, liked_by_me: !x.liked_by_me, likes_count: x.likes_count + (x.liked_by_me ? -1 : 1) }
          : x,
      ),
    )
    await api.togglePostLike(post.id).catch(() => {})
  }

  async function remove(post: PostItem) {
    if (!confirm("Delete this post?")) return
    await api.deletePost(post.id)
    setPosts((p) => p.filter((x) => x.id !== post.id))
  }

  if (authLoading || !user) return null

  return (
    <AppShell>
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-2.5">
        <Link
          href="/chats"
          aria-label="Back"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Posts</h1>
      </header>

      {/* Composer */}
      <div className="shrink-0 border-b border-border p-4">
        <div className="flex gap-3">
          <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              rows={2}
              maxLength={500}
              className="w-full resize-none bg-transparent text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {imagePreview && (
              <div className="relative mt-1 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover" />
                <button
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
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
                className="flex size-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
              >
                <ImageIcon className="size-5" />
              </button>
              <button
                onClick={submitPost}
                disabled={posting || (!text.trim() && !imageFile)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">No posts yet — be the first!</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id} className="flex gap-3 p-4">
                <Link href={`/users/${post.user.id}`}>
                  <UserAvatar src={post.user.avatar_url || "/avatars/you.png"} name={post.user.name} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/users/${post.user.id}`} className="truncate font-semibold text-foreground hover:underline">
                      {post.user.name}
                    </Link>
                    <span className="truncate text-sm text-muted-foreground">@{post.user.username}</span>
                    <span className="text-sm text-muted-foreground">· {timeAgo(post.created_at)}</span>
                    {post.user.id === user.id && (
                      <button onClick={() => remove(post)} className="ml-auto text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  {post.text && <p className="mt-1 text-pretty text-[0.95rem] leading-relaxed text-foreground">{post.text}</p>}
                  {post.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image_url} alt="Post" className="mt-2 max-h-96 w-full rounded-2xl object-cover" />
                  )}
                  <button
                    onClick={() => toggleLike(post)}
                    className={cn(
                      "mt-2 flex items-center gap-1.5 text-sm transition-colors",
                      post.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-destructive",
                    )}
                  >
                    <Heart className={cn("size-4", post.liked_by_me && "fill-destructive")} />
                    {post.likes_count > 0 && post.likes_count}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
