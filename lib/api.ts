// lib/api.ts
// Central place for every call to the Laravel backend.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken()

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  }

  // Only set JSON content-type when we're not sending FormData
  // (FormData needs the browser to set its own multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error = new Error(body.message || "Request failed") as Error & { errors?: unknown; status?: number }
    error.errors = body.errors
    error.status = res.status
    throw error
  }

  // 204 No Content etc.
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (
    data: { name: string; username: string; email: string; password: string; password_confirmation: string },
    avatar?: File | null,
  ) => {
    if (avatar) {
      const form = new FormData()
      Object.entries(data).forEach(([key, value]) => form.append(key, value))
      form.append("avatar", avatar)
      return request("/register", { method: "POST", body: form })
    }
    return request("/register", { method: "POST", body: JSON.stringify(data) })
  },

  login: (data: { email: string; password: string }) =>
    request("/login", { method: "POST", body: JSON.stringify(data) }),

  logout: () => request("/logout", { method: "POST" }),

  me: () => request("/me"),

  getConversations: () => request("/conversations"),

  getUsers: () => request("/users"),

  getUser: (id: number | string) => request(`/users/${id}`),

  getConversation: (id: string) => request(`/conversations/${id}`),

  markConversationRead: (id: string) => request(`/conversations/${id}/read`, { method: "POST" }),

  toggleMute: (id: string) => request(`/conversations/${id}/mute`, { method: "PATCH" }),

  leaveConversation: (id: string) => request(`/conversations/${id}/leave`, { method: "POST" }),

  getStatuses: () => request("/statuses"),

  postTextStatus: (text: string, background: string) =>
    request("/statuses", { method: "POST", body: JSON.stringify({ type: "text", text, background }) }),

  postImageStatus: (file: File) => {
    const form = new FormData()
    form.append("type", "image")
    form.append("image", file)
    return request("/statuses", { method: "POST", body: form })
  },

  markStatusViewed: (id: number) => request(`/statuses/${id}/view`, { method: "POST" }),

  deleteStatus: (id: number) => request(`/statuses/${id}`, { method: "DELETE" }),

  updateProfile: (
    data: { name?: string; username?: string; bio?: string; status?: string },
    avatar?: File | null,
    coverPhoto?: File | null,
  ) => {
    const form = new FormData()
    form.append("_method", "PATCH") // Laravel method spoofing — PHP can't parse multipart PATCH bodies directly
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) form.append(key, value)
    })
    if (avatar) form.append("avatar", avatar)
    if (coverPhoto) form.append("cover_photo", coverPhoto)
    return request("/me", { method: "POST", body: form })
  },

  createConversation: (data: { member_ids: number[]; is_group?: boolean; name?: string }, avatar?: File | null) => {
    if (avatar) {
      const form = new FormData()
      data.member_ids.forEach((id) => form.append("member_ids[]", String(id)))
      if (data.is_group !== undefined) form.append("is_group", data.is_group ? "1" : "0")
      if (data.name) form.append("name", data.name)
      form.append("avatar", avatar)
      return request("/conversations", { method: "POST", body: form })
    }
    return request("/conversations", { method: "POST", body: JSON.stringify(data) })
  },

  sendTextMessage: (conversationId: string, text: string) =>
    request(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ type: "text", text }),
    }),

  sendImageMessage: (conversationId: string, file: File, caption?: string) => {
    const form = new FormData()
    form.append("type", "image")
    form.append("image", file)
    if (caption) form.append("caption", caption)
    return request(`/conversations/${conversationId}/messages`, { method: "POST", body: form })
  },

  sendVoiceMessage: (conversationId: string, blob: Blob, duration: string, waveform?: number[]) => {
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"
    const form = new FormData()
    form.append("type", "voice")
    form.append("audio", blob, `voice-note.${ext}`)
    form.append("duration", duration)
    if (waveform) form.append("waveform", JSON.stringify(waveform))
    return request(`/conversations/${conversationId}/messages`, { method: "POST", body: form })
  },
}

export { API_URL, getToken }
