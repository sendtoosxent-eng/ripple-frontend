"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Phone, PhoneIncoming } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getEcho } from "@/lib/echo"
import { UserAvatar } from "@/components/user-avatar"
import { api } from "@/lib/api"
import { normalizePage } from "@/lib/pagination"

type IncomingCall = {
  actor_name?: string
  actor_avatar?: string | null
  conversation_id: number
}

type CallNotification = {
  id: number
  type: string
  data: IncomingCall
  created_at: string
}

export function IncomingCallListener() {
  const { user } = useAuth()
  const router = useRouter()
  const [call, setCall] = useState<IncomingCall | null>(null)

  useEffect(() => {
    if (!user) return
    const echo = getEcho()
    if (!echo) return
    const channel = echo.private(`user.${user.id}`)
    const receive = (event: { notification?: { type?: string; data?: IncomingCall } }) => {
      if (event.notification?.type === "incoming_call" && event.notification.data) setCall(event.notification.data)
    }
    channel.listen(".notification.created", receive)
    return () => channel.stopListening(".notification.created", receive)
  }, [user])

  useEffect(() => {
    if (!user) return
    let active = true
    let latestSeenId = 0

    const poll = async () => {
      try {
        const result = normalizePage<CallNotification>(await api.getNotifications(1))
        const newestId = Math.max(0, ...result.items.map((item) => item.id))
        const incoming = result.items.find((item) => item.type === "incoming_call" && item.id > latestSeenId && Date.now() - new Date(item.created_at).getTime() < 35_000)
        latestSeenId = Math.max(latestSeenId, newestId)
        if (active && incoming) setCall(incoming.data)
      } catch {}
    }

    void poll()
    const timer = window.setInterval(poll, 3000)
    return () => { active = false; window.clearInterval(timer) }
  }, [user])

  useEffect(() => {
    if (!call) return
    const timer = window.setTimeout(() => setCall(null), 30_000)
    return () => window.clearTimeout(timer)
  }, [call])

  if (!call || typeof document === "undefined") return null
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden bg-[#071b14] px-6 text-center text-white">
      {call.actor_avatar && <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${call.actor_avatar})` }} />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#071b14]/60 to-[#03100c]" />
      <div className="relative flex size-28 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/10 shadow-2xl">
        {call.actor_avatar ? <UserAvatar src={call.actor_avatar} name={call.actor_name || "Caller"} size="xl" className="size-28" /> : <PhoneIncoming className="size-11" />}
      </div>
      <p className="relative mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Incoming voice call</p>
      <h2 className="relative mt-3 text-3xl font-semibold">{call.actor_name || "Ripple contact"}</h2>
      <div className="relative mt-16 flex w-full max-w-xs justify-between">
        <div><button onClick={() => setCall(null)} className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-xl" aria-label="Dismiss call"><Phone className="size-7 rotate-[135deg]" /></button><p className="mt-2 text-xs text-white/70">Dismiss</p></div>
        <div><button onClick={() => { const id = call.conversation_id; setCall(null); router.push(`/chats/${id}`) }} className="flex size-16 items-center justify-center rounded-full bg-[#25d366] shadow-xl" aria-label="Open call"><Phone className="size-7" /></button><p className="mt-2 text-xs text-white/70">Open</p></div>
      </div>
    </div>,
    document.body,
  )
}
