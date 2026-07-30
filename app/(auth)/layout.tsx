import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      {children}
    </ClerkProvider>
  )
}