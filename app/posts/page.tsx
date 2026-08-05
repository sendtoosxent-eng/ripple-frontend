"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, Heart, ImageIcon, MessageSquare, Repeat2, Send, Trash2, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/user-avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { getEcho } from "@/lib/echo"
import { cn } from "@/lib/utils"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"
import { mergeUnique, normalizePage } from "@/lib/pagination"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ListLoading } from "@/components/list-loading"

type PostItem = {
  id: number
  text: string | null
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
  reposts_count: number
  liked_by_me: boolean
  reposted_by_me: boolean
  user: { id: number; name: string; username: string; avatar_url: string | null }
}

type CommentItem = {
  id: number
  text: string
  created_at: string
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
  const [composerOpen, setComposerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openComments, setOpenComments] = useState<number | null>(null)
  const [comments, setComments] = useState<Record<number, CommentItem[]>>({})
  const [commentDraft, setCommentDraft] = useState("")
  const [pendingDelete, setPendingDelete] = useState<PostItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [commentPages, setCommentPages] = useState<Record<number, { page: number; hasMore: boolean; loading: boolean }>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    api
      .getPosts(1)
      .then((res) => {
        const result = normalizePage<PostItem>(res)
        setPosts(result.items)
        setPage(result.page)
        setHasMore(result.hasMore)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load posts"))
      .finally(() => setLoading(false))
  }, [user])

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const result = normalizePage<PostItem>(await api.getPosts(page + 1), page + 1)
      setPosts((current) => mergeUnique(current, result.items, (item) => item.id))
      setPage(result.page)
      setHasMore(result.hasMore)
    } finally { setLoadingMore(false) }
  }, [hasMore, loadingMore, page])

  // Live: new posts from anyone appear instantly at the top, no refresh needed
  useEffect(() => {
    if (!user) return
    const echo = getEcho()
    if (!echo) return

    const channel = echo.channel("posts")
    channel.listen(".post.created", (e: { post: any }) => {
      setPosts((p) => {
        if (p.some((existing) => existing.id === e.post.id)) return p
        return [
          { ...e.post, likes_count: 0, comments_count: 0, reposts_count: 0, liked_by_me: false, reposted_by_me: false },
          ...p,
        ]
      })
    })

    return () => {
      echo.leaveChannel("posts")
    }
  }, [user])

  // Live: while a comment thread is open, new comments from others appear instantly
  useEffect(() => {
    if (!user || !openComments) return
    const echo = getEcho()
    if (!echo) return

    const channel = echo.channel(`post.${openComments}`)
    channel.listen(".comment.added", (e: { comment: CommentItem & { user: { id: number } } }) => {
      if (e.comment.user.id === user.id) return // already added optimistically when I sent it
      setComments((c) => ({ ...c, [openComments]: [...(c[openComments] || []), e.comment] }))
      setPosts((p) => p.map((x) => (x.id === openComments ? { ...x, comments_count: x.comments_count + 1 } : x)))
    })

    return () => {
      echo.leaveChannel(`post.${openComments}`)
    }
  }, [user, openComments])

  async function submitPost() {
    if (!text.trim() && !imageFile) return
    setPosting(true)
    try {
      const newPost = await api.createPost(text.trim(), imageFile)
      setPosts((p) => [{ ...newPost, likes_count: 0, comments_count: 0, reposts_count: 0, liked_by_me: false, reposted_by_me: false }, ...p])
      setText("")
      setImageFile(null)
      setImagePreview(null)
      setComposerOpen(false)
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

  async function toggleRepost(post: PostItem) {
    setPosts((p) =>
      p.map((x) =>
        x.id === post.id
          ? { ...x, reposted_by_me: !x.reposted_by_me, reposts_count: x.reposts_count + (x.reposted_by_me ? -1 : 1) }
          : x,
      ),
    )
    await api.togglePostRepost(post.id).catch(() => {})
  }

  async function toggleComments(post: PostItem) {
    if (openComments === post.id) {
      setOpenComments(null)
      return
    }
    setOpenComments(post.id)
    if (!comments[post.id]) {
      const result = normalizePage<CommentItem>(await api.getPostComments(post.id, 1))
      setComments((c) => ({ ...c, [post.id]: result.items }))
      setCommentPages((current) => ({ ...current, [post.id]: { page: result.page, hasMore: result.hasMore, loading: false } }))
    }
  }

  async function loadMoreComments(postId: number) {
    const state = commentPages[postId]
    if (!state?.hasMore || state.loading) return
    setCommentPages((current) => ({ ...current, [postId]: { ...state, loading: true } }))
    try {
      const result = normalizePage<CommentItem>(await api.getPostComments(postId, state.page + 1), state.page + 1)
      setComments((current) => ({ ...current, [postId]: mergeUnique(current[postId] || [], result.items, (item) => item.id) }))
      setCommentPages((current) => ({ ...current, [postId]: { page: result.page, hasMore: result.hasMore, loading: false } }))
    } catch {
      setCommentPages((current) => ({ ...current, [postId]: { ...state, loading: false } }))
    }
  }

  async function submitComment(post: PostItem) {
    const text = commentDraft.trim()
    if (!text) return
    setCommentDraft("")
    const newComment = await api.addPostComment(post.id, text)
    setComments((c) => ({ ...c, [post.id]: [...(c[post.id] || []), newComment] }))
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, comments_count: x.comments_count + 1 } : x)))
  }

  async function remove(post: PostItem) {
    setDeleting(true)
    try {
      await api.deletePost(post.id)
      setPosts((p) => p.filter((x) => x.id !== post.id))
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <AppShell>
      <header className="flex shrink-0 items-center justify-between border-b border-border/70 px-5 py-3.5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Posts</h1>
          <p className="text-xs text-muted-foreground">Moments from your circle</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/notifications" aria-label="Notifications" className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground">
            <Bell className="size-5" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Composer */}
      <div className="shrink-0 border-b border-border/70 p-4">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm shadow-primary/5">
        <div className="flex gap-3">
          <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              rows={composerOpen || imagePreview ? 3 : 1}
              onFocus={() => setComposerOpen(true)}
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
            <div className={cn("mt-2 items-center justify-between", composerOpen || imagePreview ? "flex" : "hidden")}>
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
                aria-label="Add an image"
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
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto bg-muted/20 px-3 pb-24 pt-3">
        {loading ? (
          <ListLoading label="Loading posts" />
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-card px-6 py-12 text-center text-sm text-destructive">{error}</div>
        ) : posts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">No posts yet — be the first!</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm shadow-primary/5">
                <div className="flex gap-3">
                  <Link href={`/users/${post.user.id}`}>
                    <UserAvatar src={post.user.avatar_url || "/avatars/you.png"} name={post.user.name} size="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/users/${post.user.id}`} className="truncate font-semibold text-foreground hover:underline">
                        {post.user.name}
                      </Link>
                      <Link href={`/users/${post.user.id}`} className="truncate text-sm text-muted-foreground hover:underline">
                        @{post.user.username}
                      </Link>
                      <span className="text-sm text-muted-foreground">· {timeAgo(post.created_at)}</span>
                      {post.user.id === user.id && (
                        <button aria-label="Delete post" onClick={() => setPendingDelete(post)} className="ml-auto flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                    {post.text && <p className="mt-1 text-pretty text-[0.95rem] leading-relaxed text-foreground">{post.text}</p>}
                    {post.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt="Post" className="mt-2 max-h-96 w-full rounded-2xl object-cover" />
                    )}
                    <div className="mt-2 flex items-center gap-5">
                      <button
                        aria-label={post.liked_by_me ? "Unlike post" : "Like post"}
                        onClick={() => toggleLike(post)}
                        className={cn(
                          "flex items-center gap-1.5 text-sm transition-colors",
                          post.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-destructive",
                        )}
                      >
                        <Heart className={cn("size-4", post.liked_by_me && "fill-destructive")} />
                        {post.likes_count > 0 && post.likes_count}
                      </button>
                      <button
                        aria-label={openComments === post.id ? "Hide comments" : "Show comments"}
                        onClick={() => toggleComments(post)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <MessageSquare className="size-4" />
                        {post.comments_count > 0 && post.comments_count}
                      </button>
                      <button
                        aria-label={post.reposted_by_me ? "Undo repost" : "Repost"}
                        onClick={() => toggleRepost(post)}
                        className={cn(
                          "flex items-center gap-1.5 text-sm transition-colors",
                          post.reposted_by_me ? "text-emerald-600" : "text-muted-foreground hover:text-emerald-600",
                        )}
                      >
                        <Repeat2 className="size-4" />
                        {post.reposts_count > 0 && post.reposts_count}
                      </button>
                    </div>

                    {openComments === post.id && (
                      <div className="mt-3 space-y-3 border-t border-border pt-3">
                        {(comments[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <UserAvatar src={c.user.avatar_url || "/avatars/you.png"} name={c.user.name} size="sm" />
                            <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 px-3 py-1.5">
                              <p className="text-xs font-semibold text-foreground">{c.user.name}</p>
                              <p className="text-sm text-foreground">{c.text}</p>
                            </div>
                          </div>
                        ))}
                        {commentPages[post.id]?.hasMore && (
                          <button type="button" onClick={() => loadMoreComments(post.id)} disabled={commentPages[post.id]?.loading} className="w-full py-1 text-xs font-semibold text-primary disabled:opacity-60">
                            {commentPages[post.id]?.loading ? "Loading…" : "Load more comments"}
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <UserAvatar src={user.avatar_url || "/avatars/you.png"} name={user.name} size="sm" />
                          <input
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitComment(post)}
                            placeholder="Write a comment..."
                            className="h-9 flex-1 rounded-full border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:border-ring"
                          />
                          <button
                            aria-label="Send comment"
                            onClick={() => submitComment(post)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          >
                            <Send className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <InfiniteScrollTrigger hasMore={hasMore} loading={loadingMore} onLoadMore={loadMorePosts} />
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete post?"
        description="This post and its comments will be permanently removed."
        busy={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
      />
      <BottomNav />
    </AppShell>
  )
}
