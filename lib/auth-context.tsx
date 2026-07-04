"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/lib/api"

type User = {
  id: number
  name: string
  username: string
  email: string
  avatar: string | null
  avatar_url: string | null
  cover_photo_url?: string | null
  status?: string | null
  bio?: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    data: {
      name: string
      username: string
      email: string
      password: string
      password_confirmation: string
    },
    avatar?: File | null,
  ) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, if we have a saved token, fetch the current user
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.login({ email, password })
    localStorage.setItem("token", res.token)
    setUser(res.user)
  }

  async function register(
    data: {
      name: string
      username: string
      email: string
      password: string
      password_confirmation: string
    },
    avatar?: File | null,
  ) {
    const res = await api.register(data, avatar)
    localStorage.setItem("token", res.token)
    setUser(res.user)
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      // even if the request fails, clear local state
    }
    localStorage.removeItem("token")
    setUser(null)
  }

  async function refreshUser() {
    const u = await api.me()
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
