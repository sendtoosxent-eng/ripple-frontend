"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface FloatingIndicatorProps {
  activeIndex: number
  icon: LucideIcon
  count: number
}

export function FloatingIndicator({
  activeIndex,
  icon: Icon,
  count,
}: FloatingIndicatorProps) {
  return (
    <motion.div
      className="absolute left-0 top-0 z-30 flex w-1/5 justify-center pointer-events-none"
      animate={{
        x: `${activeIndex * 100}%`,
      }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 28,
        mass: 0.7,
      }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: [0.9, 1.08, 1],
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          duration: 0.35,
        }}
        className="
          relative
          -translate-y-7
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-lime-400
          shadow-[0_12px_30px_rgba(132,204,22,.45)]
          ring-8
          ring-background
        "
      >
        <Icon
          className="h-7 w-7 text-zinc-900"
          strokeWidth={2.8}
        />

        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="
              absolute
              -right-1
              top-0
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-[10px]
              font-bold
              text-white
              shadow-lg
            "
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  )
}