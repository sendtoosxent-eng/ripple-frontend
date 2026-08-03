export function ListLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3 px-3 py-6">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex animate-pulse items-center gap-3 rounded-2xl p-2 motion-reduce:animate-none">
          <span className="size-12 shrink-0 rounded-full bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/5 rounded-full bg-muted" />
            <span className="block h-3 w-4/5 rounded-full bg-muted" />
          </span>
        </div>
      ))}
    </div>
  )
}
