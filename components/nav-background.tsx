"use client"

export function NavBackground() {
  return (
    <div className="absolute inset-0 overflow-visible">
      <svg
        viewBox="0 0 430 90"
        preserveAspectRatio="none"
        className="h-full w-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.18)]"
      >
        <defs>
          <filter
            id="shadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="10"
              floodOpacity="0.18"
            />
          </filter>
        </defs>

        {/* Main Bar */}
        <path
          filter="url(#shadow)"
          fill="white"
          d="
            M20,20
            Q20,0 40,0

            H155

            C170,0 182,0 192,18

            C200,34 212,44 215,44

            C218,44 230,34 238,18

            C248,0 260,0 275,0

            H390

            Q410,0 410,20

            V70

            Q410,90 390,90

            H40

            Q20,90 20,70

            Z
          "
          className="fill-white dark:fill-zinc-900"
        />

        {/* Top Border */}
        <path
          d="
            M40 0
            H155
            C170,0 182,0 192,18
            C200,34 212,44 215,44
            C218,44 230,34 238,18
            C248,0 260,0 275,0
            H390
          "
          fill="none"
          className="stroke-zinc-200 dark:stroke-zinc-700"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}