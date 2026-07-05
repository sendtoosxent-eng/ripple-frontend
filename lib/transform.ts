// lib/transform.ts
// Converts Laravel API responses into the shapes the existing UI components expect.

import type { Conversation, Message, User } from "@/lib/data"

type ApiUser = {
  id: number
  name: string
  username: string
  avatar: string | null
  avatar_url: string | null
  status?: string | null
  bio?: string | null
  online?: boolean
}

type ApiMessage = {
  id: number
  conversation_id: number
  sender_id: number
  type: "text" | "image" | "voice"
  text: string | null
  media_url: string | null
  voice_duration: string | null
  waveform: number[] | null
  width: number | null
  height: number | null
  status: "sent" | "delivered" | "read"
  created_at: string
  sender: ApiUser
}

type ApiConversation = {
  id: number
  name: string | null
  is_group: boolean
  avatar: string | null
  avatar_url: string | null
  members: ApiUser[]
  messages?: ApiMessage[]
  latestMessage?: ApiMessage | null
  unread?: number
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function toUiUser(u: ApiUser): User {
  return {
    id: String(u.id),
    name: u.name,
    username: `@${u.username}`,
    avatar: u.avatar_url || "/avatars/you.png",
    status: u.status || "",
    bio: u.bio || undefined,
    online: u.online,
  }
}

export function toUiMessage(m: ApiMessage, myId: number): Message {
  const base = {
    id: String(m.id),
    from: (m.sender_id === myId ? "me" : "them") as "me" | "them",
    time: fmtTime(m.created_at),
    status: m.status,
    senderName: m.sender?.name,
    senderAvatar: m.sender?.avatar_url || undefined,
  }

  if (m.type === "image") {
    return { ...base, type: "image", src: m.media_url || "/placeholder.svg", caption: m.text || undefined, width: m.width || 1200, height: m.height || 900 }
  }
  if (m.type === "voice") {
    return { ...base, type: "voice", duration: m.voice_duration || "0:00", waveform: m.waveform || Array.from({ length: 28 }, () => 0.5), src: m.media_url || undefined }
  }
  return { ...base, type: "text", text: m.text || "" }
}

// conversation, as returned by GET /conversations (list) or GET /conversations/{id} (detail)
export function toUiConversation(c: ApiConversation, myId: number): Conversation {
  const otherMember = !c.is_group ? c.members.find((m) => m.id !== myId) : null
  const displayName = c.is_group ? c.name || "Group chat" : otherMember?.name || "Unknown"
  const displayAvatar = c.is_group ? c.avatar_url || "/avatars/group-weekend.png" : otherMember?.avatar_url || "/avatars/you.png"

  const latest = c.latestMessage
  const lastMessage = latest
    ? latest.type === "text"
      ? latest.text || ""
      : latest.type === "image"
        ? "Photo"
        : "Voice message"
    : "Say hi 👋"

  return {
    id: String(c.id),
    name: displayName,
    avatar: displayAvatar,
    isGroup: c.is_group,
    online: otherMember?.online,
    members: c.members.map(toUiUser),
    lastMessage,
    lastMessageType: latest?.type,
    time: latest ? fmtTime(latest.created_at) : "",
    unread: c.unread || 0,
    messages: (c.messages || []).map((m) => toUiMessage(m, myId)),
  }
}
