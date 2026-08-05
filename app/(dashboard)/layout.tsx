import { SidebarProvider } from "@/components/ui/sidebar"
import { WorkflowSidebar } from "@/components/dashboard/workflow-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
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
    </>
  )
}