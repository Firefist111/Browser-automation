"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlayIcon, Loader2Icon } from "lucide-react"
import { runWorkflowAction } from "@/features/workflows/actions"

interface RightSidebarProps {
  workflowId: string
}

export function RightSidebar({ workflowId }: RightSidebarProps) {
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const result = await runWorkflowAction(workflowId)
      console.log("Workflow run triggered:", result.runId)
    } catch (error) {
      console.error("Failed to run workflow:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/50">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-sm font-medium text-muted-foreground">Inspector</p>
        <Button variant="default" size="sm" onClick={handleRun} disabled={isRunning}>
          {isRunning ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <PlayIcon />
          )}
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a node to inspect</p>
      </div>
    </div>
  )
}
