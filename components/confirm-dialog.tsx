"use client"

import { useEffect, useRef } from "react"

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const close = (event: KeyboardEvent) => event.key === "Escape" && onCancel()
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center bg-foreground/35 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="confirm-title" className="text-lg font-bold text-foreground">{title}</h2>
        <p id="confirm-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} onClick={onCancel} disabled={busy} className="h-10 rounded-xl px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
