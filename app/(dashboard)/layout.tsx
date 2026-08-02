import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { Geist, Geist_Mono } from "next/font/google"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WorkflowSidebar } from "@/components/dashboard/workflow-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthControls } from "@/components/auth-controls"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }} taskUrls={{ 'choose-organization': '/choose-organization' }}>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(
          "antialiased",
          fontMono.variable,
          "font-sans",
          geist.variable
        )}
      >
        <body suppressHydrationWarning>
          <TooltipProvider>
            <SidebarProvider defaultOpen={true}>
              <WorkflowSidebar />
              <main className="flex-1">
                {children}
              </main>
            </SidebarProvider>
          </TooltipProvider>
          <ThemeProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}