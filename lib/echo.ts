// lib/echo.ts
// Sets up Laravel Echo connected to your Reverb WebSocket server.
// Requires: npm install laravel-echo pusher-js

import Echo from "laravel-echo"
import Pusher from "pusher-js"
import { getToken, API_URL } from "@/lib/api"

let echoInstance: Echo<any> | null = null

export function getEcho() {
  if (typeof window === "undefined") return null
  if (echoInstance) return echoInstance

  // @ts-expect-error Echo expects Pusher on window when using the pusher broadcaster
  window.Pusher = Pusher

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http"
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080)

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || "localhost",
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: scheme === "https" ? ["wss"] : ["ws", "wss"],
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
      },
    },
  })

  return echoInstance
}

export function disconnectEcho() {
  echoInstance?.disconnect()
  echoInstance = null
}