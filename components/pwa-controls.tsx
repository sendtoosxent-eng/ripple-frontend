"use client"

import { useEffect, useState } from "react"
import { BellRing, Download, Smartphone } from "lucide-react"
import { api } from "@/lib/api"
import { getInstallPrompt, isStandalone, saveInstallPrompt, subscribeToInstallPrompt, type InstallPrompt } from "@/lib/pwa-install"

function applicationKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - value.length % 4) % 4)
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index)
  return bytes
}

export function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(() => getInstallPrompt())
  const [installed, setInstalled] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setInstallPrompt(getInstallPrompt())
    const syncInstalled = () => { setInstalled(isStandalone()); sync() }
    setInstalled(isStandalone())
    const unsubscribe = subscribeToInstallPrompt(sync)
    window.addEventListener("appinstalled", syncInstalled)
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then(async (subscription) => {
          setSubscribed(Boolean(subscription))
          if (!subscription) return
          const json = subscription.toJSON()
          if (json.endpoint && json.keys?.p256dh && json.keys.auth) {
            await api.savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
          }
        })
        .catch(() => {})
    }
    return () => { unsubscribe(); window.removeEventListener("appinstalled", syncInstalled) }
  }, [])

  async function install() {
    if (installed) return
    if (!installPrompt) {
      setMessage("To install Ripple, open your browser menu and choose Install app or Add to Home screen.")
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    saveInstallPrompt(null)
    if (choice.outcome === "accepted") setMessage("Ripple is being installed.")
    else setMessage("Installation was cancelled. You can try again from your browser menu.")
  }

  async function togglePush() {
    setBusy(true); setMessage(null)
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Push notifications are not supported by this browser.")
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        await api.removePushSubscription(existing.endpoint)
        await existing.unsubscribe()
        setSubscribed(false); setMessage("Phone notifications are off on this device."); return
      }
      if (await Notification.requestPermission() !== "granted") throw new Error("Notification permission was not granted. You can enable it later in browser settings.")
      const { public_key: publicKey } = await api.getVapidPublicKey()
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("The browser returned an incomplete push subscription.")
      await api.savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
      setSubscribed(true); setMessage("Phone notifications are enabled on this device.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifications could not be configured.")
    } finally { setBusy(false) }
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70"><Smartphone className="size-4.5" /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">Install Ripple</p><p className="text-xs text-muted-foreground">Add Ripple to your home screen.</p></div>
        <button onClick={install} disabled={installed} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold disabled:opacity-50"><Download className="size-3.5" /> {installed ? "Installed" : installPrompt ? "Install" : "Install help"}</button>
      </div>
      <div className="mx-4 h-px bg-border" />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70"><BellRing className="size-4.5" /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">Phone notifications</p><p className="text-xs text-muted-foreground">Receive alerts after granting browser permission.</p></div>
        <button onClick={togglePush} disabled={busy} className="h-9 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Working…" : subscribed ? "Disable" : "Enable"}</button>
      </div>
      {message && <p role="status" className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{message}</p>}
    </section>
  )
}
