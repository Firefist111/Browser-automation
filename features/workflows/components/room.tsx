"use client"

import type { ReactNode } from "react"
import { LiveList } from "@liveblocks/client"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

export function Room({
  children,
  roomId,
}: {
  children: ReactNode
  roomId: string
}) {
  return (
    <LiveblocksProvider
      throttle={32}
      authEndpoint="/api/liveblocks-auth"
    >
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null }}
        initialStorage={{
          nodes: new LiveList([]),
          edges: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
