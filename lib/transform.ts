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
  reply_preview?: { id: number; sender_name: string; preview: string } | null
  status_reply_preview?: { id: number; type: "text" | "image"; text: string | null; media_url: string | null; background: string | null } | null
  reaction_summary?: { emoji: string; count: number; user_ids: number[] }[]
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
    replyPreview: m.reply_preview
      ? { id: String(m.reply_preview.id), senderName: m.reply_preview.sender_name, preview: m.reply_preview.preview }
      : null,
    statusReplyPreview: m.status_reply_preview
      ? {
          id: String(m.status_reply_preview.id),
          type: m.status_reply_preview.type,
          text: m.status_reply_preview.text,
          mediaUrl: m.status_reply_preview.media_url,
          background: m.status_reply_preview.background,
        }
      : null,
    reactions: (m.reaction_summary || []).map((r) => ({ emoji: r.emoji, count: r.count, userIds: r.user_ids })),
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
