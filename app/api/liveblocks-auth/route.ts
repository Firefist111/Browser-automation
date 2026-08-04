import { auth } from "@clerk/nextjs/server"
import { Liveblocks } from "@liveblocks/node"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

export async function POST(request: Request) {
  // Get the current user from Clerk session claims (fast, no extra API call)
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Parse the room ID from the request body sent by the Liveblocks client
  const body = await request.json()
  const roomId = body?.room as string | undefined

  // Build user info from session claims (avoids slow currentUser() API call)
  const claims = sessionClaims as Record<string, unknown> | undefined
  const firstName = (claims?.firstName as string) ?? ""
  const lastName = (claims?.lastName as string) ?? ""
  const username = (claims?.username as string) ?? ""
  const email = (claims?.email as string) ?? ""
  const imageUrl = (claims?.imageUrl as string) ?? ""

  const name = firstName
    ? `${firstName} ${lastName}`.trim()
    : username || email || "Anonymous"

  // Start a Liveblocks session with the official pattern
  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name,
      avatar: imageUrl,
    },
  })

  // Grant the user read + write access to the requested room
  if (roomId) {
    session.allow(roomId, session.FULL_ACCESS)
  }

  // Authorize the session
  const { status, body: authBody } = await session.authorize()

  return new Response(authBody, {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
