import { LiveList, LiveObject } from "@liveblocks/client"
import type { JsonObject } from "@liveblocks/client"

declare global {
  interface Liveblocks {
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
        orgId?: string;
      };
    };
    Presence: {
      cursor: { x: number; y: number } | null;
    };
    Storage: {
      nodes: LiveList<LiveObject<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: JsonObject;
      }>>;
      edges: LiveList<LiveObject<{
        id: string;
        source: string;
        target: string;
      }>>;
    };
  }
}

export {};