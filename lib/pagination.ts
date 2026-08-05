export type PageResult<T> = {
  items: T[]
  page: number
  hasMore: boolean
}

export function normalizePage<T>(response: unknown, requestedPage = 1): PageResult<T> {
  if (Array.isArray(response)) return { items: response as T[], page: requestedPage, hasMore: false }

  const value = (response || {}) as Record<string, unknown>
  const rawItems = Array.isArray(value.data)
    ? value.data
    : Array.isArray(value.items)
      ? value.items
      : Array.isArray(value.results)
        ? value.results
        : []
  const meta = (value.meta && typeof value.meta === "object" ? value.meta : value) as Record<string, unknown>
  const page = Number(meta.current_page ?? meta.page ?? requestedPage) || requestedPage
  const lastPage = Number(meta.last_page ?? meta.total_pages ?? page)
  const hasExplicitMore = meta.has_more ?? meta.hasMore
  const next = meta.next_page_url ?? meta.next_cursor ?? meta.next_page
  const hasMore = typeof hasExplicitMore === "boolean"
    ? hasExplicitMore
    : next != null
      ? Boolean(next)
      : Number.isFinite(lastPage) && lastPage > page

  return { items: rawItems as T[], page, hasMore }
}

export function mergeUnique<T>(current: T[], incoming: T[], key: (item: T) => string | number): T[] {
  const seen = new Set(current.map(key))
  return [...current, ...incoming.filter((item) => !seen.has(key(item)) && seen.add(key(item)))]
}
