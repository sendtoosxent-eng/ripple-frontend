import { cn } from "@/lib/utils"

export function Logo({
  className,
  showName = true,
}: {
  className?: string
  showName?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M12 3C7 3 3 6.6 3 11c0 2.5 1.3 4.7 3.3 6.1-.1 1.1-.6 2.3-1.6 3.4 1.7-.1 3.3-.6 4.6-1.6 .9.2 1.8.4 2.7.4 5 0 9-3.6 9-8s-4-8-9-8Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {showName && (
        <span className="text-lg font-bold tracking-tight text-foreground">Ripple</span>
      )}
    </div>
  )
}
