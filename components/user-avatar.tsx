import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const sizeMap = {
  sm: "size-9",
  md: "size-12",
  lg: "size-16",
  xl: "size-24",
} as const

export function UserAvatar({
  src,
  name,
  online,
  size = "md",
  className,
}: {
  src: string
  name: string
  online?: boolean
  size?: keyof typeof sizeMap
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn(sizeMap[size])}>
        <AvatarImage src={src || "/placeholder.svg"} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {online && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full bg-online ring-2 ring-background",
            size === "sm" ? "size-2.5" : size === "xl" ? "size-5 ring-4" : "size-3.5",
          )}
        >
          <span className="sr-only">Online</span>
        </span>
      )}
    </div>
  )
}
