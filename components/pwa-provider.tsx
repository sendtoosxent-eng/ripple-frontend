"use client"
import { useEffect, useState } from "react"

export function PwaProvider({ deployment }: { deployment: string }) {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return

    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    navigator.serviceWorker.register(`/sw.js?v=${deployment}`, { scope: "/" }).then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting)

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(worker)
        })
      })

      void registration.update()
    }).catch(() => {})
  }, [deployment])

  if (!waitingWorker) return null

  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-[120] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xl">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Ripple update available</p>
        <p className="text-xs text-muted-foreground">Install the latest version and reload the app.</p>
      </div>
      <button
        type="button"
        onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}
        className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
      >
        Update now
      </button>
    </div>
  )
}
