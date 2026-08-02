"use client"

import { ReactNode } from "react"
import { LiveList, LiveObject } from "@liveblocks/client"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

export function Room({
   children ,
   roomId
  }: { children: ReactNode ,roomId : string}) {
  return (
    <LiveblocksProvider
    throttle={16}
      authEndpoint="/api/liveblocks-auth"
    >
      <RoomProvider
        id={roomId}
        initialPresence={{cursor: null}}
        initialStorage={{
          nodes: new LiveList([
            new LiveObject({
              id: "start",
              type: "step",
              position: { x: 100, y: 200 },
              data: {
                type: "start",
                kind: "trigger",
                title: "Start",
                values: {},
              },
            }),
            new LiveObject({
              id: "open-url",
              type: "step",
              position: { x: 400, y: 200 },
              data: {
                type: "open-url",
                kind: "action",
                title: "Open URL",
                values: { url: "https://youtube.com" },
              },
            }),
          ]),
          edges: new LiveList([
            new LiveObject({
              id: "e-start-open-url",
              source: "start",
              target: "open-url",
            }),
          ]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}