import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * Mobile-first app shell. Full-bleed on phones, and on larger screens it centers
 * the experience in a device-like column with a soft ambient backdrop so every
 * screen scales cleanly from 360px up to desktop.
 */
export function AppShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex h-dvh overflow-hidden justify-center bg-muted/40 sm:p-4 md:p-8">
      <div
        className={cn(
          "relative flex h-dvh min-h-0 w-full max-w-md flex-col overflow-hidden bg-background sm:h-[min(900px,calc(100dvh-2rem))] sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl sm:shadow-primary/5",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
