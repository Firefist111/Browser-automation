"use client"

import { memo } from "react"

interface UserCursorProps {
  x: number
  y: number
  color: string
  name: string
}

export const UserCursor = memo(function UserCursor({
  x,
  y,
  color,
  name,
}: UserCursorProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-50"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill="currentColor"
          stroke="white"
        />
      </svg>
      <div
        className="ml-4 -mt-1 rounded px-2 py-1 text-xs font-medium text-white shadow"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
})