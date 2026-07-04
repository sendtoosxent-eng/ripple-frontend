// lib/wallpaper.ts
// Simple local wallpaper preference — applies to every chat room background.

export const WALLPAPERS = [
  { id: "default", label: "Default", className: "bg-muted/30" },
  { id: "warm", label: "Warm", className: "bg-gradient-to-b from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20" },
  { id: "cool", label: "Cool", className: "bg-gradient-to-b from-sky-50 to-blue-100 dark:from-sky-950/30 dark:to-blue-950/20" },
  { id: "mint", label: "Mint", className: "bg-gradient-to-b from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/20" },
  { id: "blush", label: "Blush", className: "bg-gradient-to-b from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-950/20" },
  { id: "dark", label: "Midnight", className: "bg-gradient-to-b from-slate-800 to-slate-900" },
] as const

export type WallpaperId = (typeof WALLPAPERS)[number]["id"]

const KEY = "chat-wallpaper"

export function getWallpaper(): WallpaperId {
  if (typeof window === "undefined") return "default"
  return (localStorage.getItem(KEY) as WallpaperId) || "default"
}

export function setWallpaper(id: WallpaperId) {
  localStorage.setItem(KEY, id)
}

export function getWallpaperClassName(id: WallpaperId) {
  return WALLPAPERS.find((w) => w.id === id)?.className || WALLPAPERS[0].className
}
