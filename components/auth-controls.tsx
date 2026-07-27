"use client"

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"

export function AuthControls() {
  const { isSignedIn } = useUser()

  return (
    <header className="flex items-center justify-end gap-4 border-b p-4">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <SignInButton />
          <SignUpButton />
        </>
      )}
    </header>
  )
}
