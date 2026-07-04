import { cn } from "@/lib/utils"

export function Waveform({
  bars,
  progress = 0,
  className,
  barClassName,
  activeClassName,
  animated = false,
}: {
  bars: number[]
  /** 0..1 portion of the waveform that is "played" / highlighted */
  progress?: number
  className?: string
  barClassName?: string
  activeClassName?: string
  animated?: boolean
}) {
  return (
    <div className={cn("flex h-8 items-center gap-[3px]", className)}>
      {bars.map((h, i) => {
        const active = i / bars.length <= progress
        return (
          <span
            key={i}
            className={cn(
              "w-[3px] shrink-0 rounded-full transition-colors",
              active ? activeClassName : barClassName,
              animated && "origin-center",
            )}
            style={{
              height: `${Math.max(12, Math.round(h * 100 * 100) / 100)}%`,
              ...(animated
                ? {
                    animation: `wave-pulse 1s ease-in-out ${i * 0.06}s infinite`,
                  }
                : {}),
            }}
          />
        )
      })}
    </div>
  )
}
