import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chatta — Messaging, made friendly",
    short_name: "Chatta",
    description: "Private messaging, voice notes, photos, groups, posts, and updates.",
    start_url: "/chats",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9fa",
    theme_color: "#1f9a9a",
    orientation: "portrait-primary",
    categories: ["social", "communication"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
