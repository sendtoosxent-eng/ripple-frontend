import Link from "next/link"
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6"
import { Heart } from "lucide-react"

import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-6 md:flex-row">
        
        {/* Social Icons */}
        <div className="flex gap-3">
          <Link
            href="#"
            className="rounded-xl border p-2 transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
          >
            <FaGithub size={18} />
          </Link>

          <Link
            href="#"
            className="rounded-xl border p-2 transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
          >
            <FaXTwitter size={18} />
          </Link>

          <Link
            href="#"
            className="rounded-xl border p-2 transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
          >
            <FaLinkedin size={18} />
          </Link>
        </div>
      </div>

      <div className="border-t py-4">
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ripple • Made with
          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          by osxent
        </p>
      </div>
    </footer>
  )
}