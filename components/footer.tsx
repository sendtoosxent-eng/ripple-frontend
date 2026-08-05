import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
        Chatta is an independent messaging app hosted at ripple-chat-six.vercel.app.
      </div>

      <div className="border-t py-4">
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Chatta • Made with
          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          by osxent
        </p>
      </div>
    </footer>
  )
}
