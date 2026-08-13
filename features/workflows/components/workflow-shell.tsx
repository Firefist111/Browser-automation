"use client"

import { useEffect } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { useOrganization, useOrganizationList } from "@clerk/nextjs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Canvas } from "./canvas"
import { RightSidebar } from "./right-sidebar"
import { ConsolePanel } from "./ConsolePanel"
import { Room } from "./room"
import { WorkflowRunsProvider } from "./WorkflowRunsProvider"

interface WorkflowShellProps {
  workflowId: string
  /** The organization that owns this workflow. Used to align the active org. */
  orgId?: string
  /** Short-lived read-only public token scoped to this workflow's run tag, for realtime run updates. */
  runToken: string
}

/**
 * Keeps the client's active organization in sync with the workflow being viewed.
 *
 * The workflow detail page can legitimately render a workflow that belongs to an
 * org different from the currently active one (the sidebar selects the active org
 * client-side, which can lag the server session). This switches the active org to
 * the workflow's owner so every downstream Server Action — save graph, delete,
 * run — targets the correct org.
 */
function SyncActiveOrganization({ orgId }: { orgId?: string }) {
  const { organization } = useOrganization()
  const { isLoaded, setActive } = useOrganizationList()

  useEffect(() => {
    if (!orgId) return
    if (!isLoaded) return
    if (organization?.id === orgId) return

    setActive({ organization: orgId }).catch((error) => {
      console.error("Failed to switch active organization to", orgId, error)
    })
  }, [orgId, isLoaded, organization?.id, setActive])

  return null
}

export function WorkflowShell({ workflowId, orgId, runToken }: WorkflowShellProps) {
  return (
    <Room roomId={workflowId}>
      <SyncActiveOrganization orgId={orgId} />
      <WorkflowRunsProvider workflowId={workflowId} publicAccessToken={runToken}>
        <ReactFlowProvider>
        <ResizablePanelGroup orientation="horizontal" className="size-full">
          <ResizablePanel minSize="18rem">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel minSize="14rem">
                <Canvas />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize="8rem" minSize="6rem">
                <ConsolePanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
            <RightSidebar workflowId={workflowId} />
          </ResizablePanel>
        </ResizablePanelGroup>
        </ReactFlowProvider>
      </WorkflowRunsProvider>
    </Room>
  )
}
