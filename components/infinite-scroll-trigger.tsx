"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

export function InfiniteScrollTrigger({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !hasMore || loading) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { rootMargin: "240px 0px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!hasMore) return null
  return <div ref={ref} className="flex h-14 items-center justify-center text-muted-foreground"><Loader2 className="size-4 animate-spin" /><span className="sr-only">Loading more</span></div>
}
