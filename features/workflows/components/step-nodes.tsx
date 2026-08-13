"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Loader2, Trash2 } from "lucide-react"
import { useMutation } from "@liveblocks/react/suspense"

import { nodeRegistry, type StepNodeType } from "../nodes/node-registry"
import { useLatestRunSteps } from "./WorkflowRunsProvider"
import { isValidUrl } from "../lib/urls"
import { cn } from "@/lib/utils"

function StepNodeComponent({ data, selected, id }: NodeProps<StepNodeType>) {
  const { type, kind, title, values } = data
  const def = nodeRegistry[type]
  const fields = def.fields.filter((field) => values[field.key])
  const { steps, isLive } = useLatestRunSteps()

  const stepStatus = steps?.find((s) => s.id === id)?.status ?? "pending"
  const isRunning = stepStatus === "running" && isLive
  const isFailed = stepStatus === "failed"

  // An Open URL node with a syntactically-invalid URL is flagged immediately in
  // the editor (even when idle), so the user sees a red border while authoring.
  const urlValue = values?.url
  const isInvalidUrl =
    type === "open-url" &&
    urlValue != null &&
    urlValue.trim() !== "" &&
    !isValidUrl(urlValue)

  const deleteNode = useMutation(({ storage }, nodeId: string) => {
    const liveNodes = storage.get("nodes")
    const index = liveNodes.findIndex((n) => n.get("id") === nodeId)
    if (index !== -1) {
      liveNodes.delete(index)
    }

    // Also delete any edges connected to this node
    const liveEdges = storage.get("edges")
    for (let i = liveEdges.length - 1; i >= 0; i--) {
      const edge = liveEdges.get(i)
      if (
        edge &&
        (edge.get("source") === nodeId || edge.get("target") === nodeId)
      ) {
        liveEdges.delete(i)
      }
    }
  }, [])

  if (!def) {
    return (
      <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">
          Unknown node type: {type}
        </p>
      </div>
    )
  }

  const Icon = def.icon

  // A trigger starts the flow and takes no input, so it has no target handle.
  const hasTarget = kind !== "trigger"

  return (
    <div
      className={cn(
        "group max-w-80 min-w-50 rounded-(--radius) border-2 border-border bg-card text-card-foreground",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        isInvalidUrl && "border-destructive",
        isRunning && "border-blue-500",
        isFailed && "border-destructive"
      )}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ transform: "translate(-100%, -50%)" }}
          className="h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! bg-border!"
        />
      )}

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            def.accent
          )}
        >
          {isRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>
        <span className="text-sm font-semibold">{title}</span>
        <button
          type="button"
          onClick={() => deleteNode(id)}
          className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          title="Delete node"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {fields.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            {fields.map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between gap-4 text-xs"
              >
                <span className="shrink-0 text-muted-foreground">
                  {field.label}
                </span>
                <span className="truncate font-medium">
                  {values[field.key]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ transform: "translate(100%, -50%)" }}
        className="h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! bg-border!"
      />
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
