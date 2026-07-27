import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function TestPage() {
  const session = await auth()

  if (!session.userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-medium">Protected Test Page</h1>
      <p className="text-sm text-muted-foreground">
        You are authenticated. This page is only visible to signed-in users.
      </p>
      <p className="text-xs text-muted-foreground">
        User ID: {session.userId}
      </p>
    </div>
  )
}
