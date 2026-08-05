export type InstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferredPrompt: InstallPrompt | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getInstallPrompt() {
  return deferredPrompt
}

export function saveInstallPrompt(prompt: InstallPrompt | null) {
  deferredPrompt = prompt
  notify()
}

export function subscribeToInstallPrompt(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function isStandalone() {
  if (typeof window === "undefined") return false
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true
}
