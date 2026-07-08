"use client"

import { motion } from "framer-motion"

interface NavBackgroundProps {
  activeIndex: number
  totalItems: number
}

export function NavBackground({
  activeIndex,
  totalItems,
}: NavBackgroundProps) {
  const width = 100 / totalItems

  return (
    <>
      {/* Main Navigation Background */}
      <div className="absolute inset-0 overflow-hidden rounded-[32px] bg-white dark:bg-zinc-900 shadow-[0_10px_35px_rgba(0,0,0,.18)] border border-zinc-200/70 dark:border-zinc-800" />

      {/* Moving Notch */}
      <motion.div
        animate={{
          left: `${activeIndex * width}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 30,
        }}
        className="absolute top-0 h-full pointer-events-none"
        style={{
          width: `${width}%`,
        }}
      >
        <div className="relative flex justify-center">
          {/* Creates the indentation */}
          <div className="absolute -top-10 h-20 w-20 rounded-full bg-background" />

          {/* Smooth left curve */}
          <div className="absolute top-4 left-0 h-8 w-8 rounded-tr-full bg-white dark:bg-zinc-900" />

          {/* Smooth right curve */}
          <div className="absolute top-4 right-0 h-8 w-8 rounded-tl-full bg-white dark:bg-zinc-900" />
        </div>
      </motion.div>
    </>
  )
}