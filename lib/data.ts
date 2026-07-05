export type User = {
  id: string
  name: string
  username: string
  avatar: string
  status: string
  bio?: string
  online?: boolean
}

export type MessageBase = {
  id: string
  from: "me" | "them"
  time: string
  status?: "sent" | "delivered" | "read"
  senderName?: string
  senderAvatar?: string
}

export type TextMessage = MessageBase & { type: "text"; text: string }
export type ImageMessage = MessageBase & {
  type: "image"
  src: string
  caption?: string
  width: number
  height: number
}
export type VoiceMessage = MessageBase & {
  type: "voice"
  duration: string
  waveform: number[]
  src?: string
}

export type Message = TextMessage | ImageMessage | VoiceMessage

export type Conversation = {
  id: string
  name: string
  avatar: string
  isGroup?: boolean
  members?: User[]
  online?: boolean
  lastMessage: string
  lastMessageType?: "text" | "image" | "voice"
  time: string
  unread: number
  muted?: boolean
  messages: Message[]
}

export const currentUser: User = {
  id: "me",
  name: "Jordan Avery",
  username: "@jordan",
  avatar: "/avatars/you.png",
  status: "Building cool things",
  bio: "Product designer. Coffee enthusiast. Probably hiking somewhere.",
  online: true,
}

const wave = (n: number) =>
  Array.from({ length: n }, (_, i) => 0.3 + Math.abs(Math.sin(i * 1.3)) * 0.7)

export const conversations: Conversation[] = [
  {
    id: "maya",
    name: "Maya Chen",
    avatar: "/avatars/maya.png",
    online: true,
    lastMessage: "That beach looks unreal 😍",
    lastMessageType: "text",
    time: "9:41 AM",
    unread: 2,
    members: [],
    messages: [
      { id: "m1", type: "text", from: "them", time: "9:30 AM", text: "Morning! How was the trip?" },
      {
        id: "m2",
        type: "text",
        from: "me",
        time: "9:32 AM",
        status: "read",
        text: "Amazing honestly. Best week in a long time.",
      },
      {
        id: "m3",
        type: "image",
        from: "me",
        time: "9:33 AM",
        status: "read",
        src: "/media/beach.png",
        caption: "Woke up to this every morning",
        width: 900,
        height: 1100,
      },
      { id: "m4", type: "text", from: "them", time: "9:40 AM", text: "That beach looks unreal 😍" },
      {
        id: "m5",
        type: "voice",
        from: "them",
        time: "9:41 AM",
        duration: "0:14",
        waveform: wave(28),
      },
    ],
  },
  {
    id: "weekend-crew",
    name: "Weekend Crew",
    avatar: "/avatars/group-weekend.png",
    isGroup: true,
    lastMessage: "Diego: I'll bring the speaker 🔊",
    lastMessageType: "text",
    time: "8:12 AM",
    unread: 5,
    members: [
      { id: "maya", name: "Maya Chen", username: "@maya", avatar: "/avatars/maya.png", status: "", online: true },
      { id: "liam", name: "Liam Park", username: "@liam", avatar: "/avatars/liam.png", status: "", online: true },
      { id: "aisha", name: "Aisha Rahman", username: "@aisha", avatar: "/avatars/aisha.png", status: "" },
      { id: "diego", name: "Diego Torres", username: "@diego", avatar: "/avatars/diego.png", status: "" },
      { id: "priya", name: "Priya Nair", username: "@priya", avatar: "/avatars/priya.png", status: "", online: true },
    ],
    messages: [
      { id: "g1", type: "text", from: "them", time: "8:00 AM", text: "Who's in for Saturday?" },
      { id: "g2", type: "text", from: "me", time: "8:05 AM", status: "read", text: "Count me in!" },
      {
        id: "g3",
        type: "image",
        from: "them",
        time: "8:08 AM",
        src: "/media/hike.png",
        caption: "Trail idea 👆",
        width: 1200,
        height: 800,
      },
      { id: "g4", type: "text", from: "them", time: "8:12 AM", text: "Diego: I'll bring the speaker 🔊" },
    ],
  },
  {
    id: "liam",
    name: "Liam Park",
    avatar: "/avatars/liam.png",
    online: true,
    lastMessage: "Voice message",
    lastMessageType: "voice",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: "l1", type: "text", from: "them", time: "Yesterday", text: "Did you see the game??" },
      { id: "l2", type: "voice", from: "them", time: "Yesterday", duration: "0:22", waveform: wave(30) },
      { id: "l3", type: "text", from: "me", time: "Yesterday", status: "delivered", text: "Insane finish 🔥" },
    ],
  },
  {
    id: "aisha",
    name: "Aisha Rahman",
    avatar: "/avatars/aisha.png",
    lastMessage: "Photo",
    lastMessageType: "image",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: "a1", type: "text", from: "them", time: "Yesterday", text: "Brunch was so good today" },
      {
        id: "a2",
        type: "image",
        from: "them",
        time: "Yesterday",
        src: "/media/food.png",
        width: 1200,
        height: 900,
      },
    ],
  },
  {
    id: "diego",
    name: "Diego Torres",
    avatar: "/avatars/diego.png",
    lastMessage: "Sounds good, talk soon 👋",
    lastMessageType: "text",
    time: "Mon",
    unread: 0,
    muted: true,
    messages: [
      { id: "d1", type: "text", from: "me", time: "Mon", status: "read", text: "Let's sync next week" },
      { id: "d2", type: "text", from: "them", time: "Mon", text: "Sounds good, talk soon 👋" },
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    avatar: "/avatars/priya.png",
    online: true,
    lastMessage: "Sent you the files",
    lastMessageType: "text",
    time: "Sun",
    unread: 0,
    messages: [
      { id: "p1", type: "text", from: "them", time: "Sun", text: "Sent you the files" },
      { id: "p2", type: "text", from: "me", time: "Sun", status: "read", text: "Perfect, thank you!" },
    ],
  },
]

export const sharedMedia = [
  "/media/beach.png",
  "/media/hike.png",
  "/media/food.png",
  "/media/city.png",
  "/media/coffee.png",
  "/media/beach.png",
]

export function getConversation(id: string) {
  return conversations.find((c) => c.id === id)
}
