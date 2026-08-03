import { auth, currentUser } from "@clerk/nextjs/server"
import { Liveblocks } from "@liveblocks/node"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

export async function POST(request: Request) {
  // Get the current user from Clerk
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Parse the room ID from the request body sent by the Liveblocks client
  const body = await request.json()
  const roomId = body?.room as string | undefined

  // Start a Liveblocks session with the official pattern
  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: user.firstName
        ? `${user.firstName} ${user.lastName ?? ""}`.trim()
        : user.username ?? user.emailAddresses[0]?.emailAddress ?? "Anonymous",
      avatar: user.imageUrl,
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
