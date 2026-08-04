"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  OrganizationSwitcher,
  UserButton,
  useUser,
  useOrganization,
  useOrganizationList,
} from "@clerk/nextjs"
import {
  ChevronLeftIcon,
  WorkflowIcon,
  PlusIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useSidebar, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { useRouter, usePathname } from "next/navigation"
import { createWorkflowAction } from "@/features/workflows/actions"

type Workflow = {
  id: string
  name: string
  orgId: string
  graph: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

function CreateWorkflowDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) return
    await createWorkflowAction(name.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Enter a name for your new workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="My Workflow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WorkflowList({
  workflows,
  activeWorkflowId,
  onSelect,
  onCreate,
}: {
  workflows: Workflow[]
  activeWorkflowId?: string
  onSelect?: (id: string) => void
  onCreate?: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-2 py-1">
        <SidebarGroupLabel className="flex-1">Workflows</SidebarGroupLabel>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 shrink-0"
          onClick={onCreate}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>
      <SidebarMenu className="flex flex-col gap-1">
        {workflows.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No workflows yet
          </p>
        ) : (
          workflows.map((workflow) => {
            const isActive = workflow.id === activeWorkflowId
            return (
              <SidebarMenuItem key={workflow.id}>
                <SidebarMenuButton
                  tooltip={workflow.name}
                  isActive={isActive}
                  className="group/menu-item"
                  onClick={() => onSelect?.(workflow.id)}
                >
                  <WorkflowIcon className="size-4 shrink-0" />
                  <span className="truncate flex-1">{workflow.name}</span>
                  {isActive && (
                    <span className="size-2 rounded-full bg-green-500 shrink-0" />
                  )}
                </SidebarMenuButton>
                <SidebarMenuAction className="absolute top-1 right-1 opacity-0 group-hover/menu-item:opacity-100">
                  <MoreHorizontalIcon className="size-3.5" />
                </SidebarMenuAction>
              </SidebarMenuItem>
            )
          })
        )}
      </SidebarMenu>
    </>
  )
}

export function WorkflowSidebar() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isLoaded, setActive, userMemberships } = useOrganizationList()
  const { state, toggleSidebar } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Extract active workflow ID from pathname (e.g., /workflows/abc-123)
  const activeWorkflowId = pathname?.startsWith("/workflows/")
    ? pathname.split("/")[2]
    : undefined

  // If no organization is selected, auto-select the first one
  useEffect(() => {
    if (!isLoaded) return
    if (organization) return
    if (userMemberships.data.length === 0) return

    const firstMembership = userMemberships.data[0]
    if (firstMembership) {
      setActive({ organization: firstMembership.organization.id })
    }
  }, [isLoaded, organization, userMemberships.data, setActive])

  const [loadWorkflowsRetryCount, setLoadWorkflowsRetryCount] = useState(0)

  useEffect(() => {
    const orgId = organization?.id
    if (!orgId) return

    let cancelled = false

    async function load() {
      setIsLoadingWorkflows(true)
      setWorkflowError(null)

      // Exponential backoff delay for 401 race conditions
      const delay = Math.min(1000 * Math.pow(2, loadWorkflowsRetryCount), 10000)

      try {
        await new Promise((resolve) => setTimeout(resolve, delay))

        const response = await fetch("/api/workflows")

        if (!response.ok) {
          const text = await response.text().catch(() => "Unknown error")
          throw new Error(`Failed to load workflows: ${response.status} - ${text}`)
        }

        const data = await response.json()
        if (!cancelled) {
          setWorkflows(data)
          setLoadWorkflowsRetryCount(0)
        }
      } catch (error) {
        console.error("Failed to fetch workflows:", error)
        if (!cancelled) {
          setWorkflowError(error instanceof Error ? error.message : "Failed to load workflows")
          setLoadWorkflowsRetryCount((prev) => prev + 1)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWorkflows(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [organization?.id, loadWorkflowsRetryCount])

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
            <>
              {workflowError && (
                <div className="px-3 py-2">
                  <p className="text-xs text-destructive mb-2">{workflowError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setLoadWorkflowsRetryCount((prev) => prev + 1)}
                    disabled={isLoadingWorkflows}
                  >
                    <RefreshCwIcon
                      className={`size-3 mr-1 ${isLoadingWorkflows ? "animate-spin" : ""}`}
                    />
                    Retry
                  </Button>
                </div>
              )}
              <WorkflowList
                workflows={workflows}
                activeWorkflowId={activeWorkflowId}
                onSelect={(id) => router.push(`/workflows/${id}`)}
                onCreate={() => setDialogOpen(true)}
              />
            </>
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
                  <WorkflowList
                    workflows={workflows}
                    activeWorkflowId={activeWorkflowId}
                    onSelect={(id) => {
                      setPopoverOpen(false)
                      router.push(`/workflows/${id}`)
                    }}
                    onCreate={() => {
                      setPopoverOpen(false)
                      setDialogOpen(true)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      <CreateWorkflowDialog open={dialogOpen} onOpenChange={setDialogOpen} />

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
