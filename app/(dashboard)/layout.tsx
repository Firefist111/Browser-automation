import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WorkflowSidebar } from "@/components/dashboard/workflow-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }} taskUrls={{ 'choose-organization': '/choose-organization' }}>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <WorkflowSidebar />
          <main className="flex-1">
            {children}
          </main>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster />
    </ClerkProvider>
  )
}
