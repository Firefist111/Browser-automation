import { auth, currentUser } from "@clerk/nextjs/server"
import { Liveblocks } from "@liveblocks/node"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get the room ID from the request body
    let roomId: string | undefined
    try {
      const body = await request.json()
      roomId = body?.room as string | undefined
    } catch {
      // Body might be empty or not JSON
    }

    if (!roomId) {
      return new Response("Missing room ID", { status: 400 })
    }

    // Get user info from Clerk
    const user = await currentUser()

    const userInfo = {
      name: user?.firstName
        ? `${user.firstName} ${user.lastName ?? ""}`.trim()
        : user?.username ?? user?.emailAddresses[0]?.emailAddress ?? userId,
      avatar: user?.imageUrl,
    }

    // Create a Liveblocks session
    const session = liveblocks.prepareSession(userId, {
      userInfo,
    })

    // Grant the user read + write access to the room
    session.allow(roomId, ["*:write"])

    // Authorize the session
    const { status, body: authBody, error } = await session.authorize()

    if (error) {
      console.error("Liveblocks authorize error:", error)
      return new Response("Internal Server Error", { status: 500 })
    }

    return new Response(authBody, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Liveblocks auth error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}