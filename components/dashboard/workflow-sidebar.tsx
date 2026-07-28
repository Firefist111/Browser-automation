"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  OrganizationSwitcher,
  UserButton,
  useUser,
} from "@clerk/nextjs"
import {
  ChevronLeftIcon,
  WorkflowIcon,
  PlusIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { useSidebar, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

const workflows = [
  {
    id: "1",
    name: "Email Automation",
    icon: WorkflowIcon,
    active: true,
  },
  {
    id: "2",
    name: "Lead Generation",
    icon: WorkflowIcon,
    active: false,
  },
  {
    id: "3",
    name: "Customer Onboarding",
    icon: WorkflowIcon,
    active: false,
  },
  {
    id: "4",
    name: "Data Sync",
    icon: WorkflowIcon,
    active: false,
  },
]

function WorkflowList({ onSelect }: { onSelect?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between px-2 py-1">
        <SidebarGroupLabel className="flex-1">Workflows</SidebarGroupLabel>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 shrink-0"
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>
      <SidebarMenu className="flex flex-col gap-1">
        {workflows.map((workflow) => (
          <SidebarMenuItem key={workflow.id}>
            <SidebarMenuButton
              isActive={workflow.active}
              tooltip={workflow.name}
              className="group/menu-item"
              onClick={onSelect}
            >
              <span className="truncate">{workflow.name}</span>
            </SidebarMenuButton>
            <SidebarMenuAction
              className="absolute top-1 right-1 opacity-0 group-hover/menu-item:opacity-100"
            >
              <MoreHorizontalIcon className="size-3.5" />
            </SidebarMenuAction>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  )
}

export function WorkflowSidebar() {
  const { user } = useUser()
  const { state, toggleSidebar } = useSidebar()
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20"
              onClick={toggleSidebar}
              title="Toggle Sidebar"
            >
              <WorkflowIcon className="size-4 text-primary" />
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold truncate">My Workspace</span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
          <SidebarTrigger className="h-8 w-8 shrink-0 flex items-center justify-center group-data-[collapsible=icon]:hidden">
            <ChevronLeftIcon className="size-4" />
          </SidebarTrigger>
        </div>
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-between",
              },
            }}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="w-full">
          {state === "expanded" ? (
            <WorkflowList />
          ) : (
            <div className="flex justify-center p-2">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <WorkflowIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <WorkflowList onSelect={() => setPopoverOpen(false)} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-8",
                  },
                }}
              />
              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">
                  {user?.fullName || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
