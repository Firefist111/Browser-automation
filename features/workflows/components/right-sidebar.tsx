"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Loader2Icon,
  MoreHorizontal,
  Play,
  SquareIcon,
  Trash2,
  CircleHelp,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { LiveObject } from "@liveblocks/client"
import { useMutation, useStorage } from "@liveblocks/react/suspense"
import { useReactFlow, useOnSelectionChange } from "@xyflow/react"
import {
  deleteWorkflowAction,
  runWorkflowAction,
  cancelWorkflowRunAction,
} from "@/features/workflows/actions"
import { useLatestRunSteps } from "./WorkflowRunsProvider"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeData,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { useUpstreamConnections } from "@/features/workflows/hooks/useUpstreamConnections"
import { isValidUrl, URL_ERROR_MESSAGE } from "@/features/workflows/lib/urls"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas. Accepts any
// node type (possibly unknown/undefined — e.g. steps recorded before type
// tracking existed) and falls back to a neutral chip so it never crashes.
export function NodeIcon({
  type,
  className,
}: {
  type: NodeType | (string & {})
  className?: string
}) {
  const def = (nodeRegistry as Record<string, NodeDefinition>)[type]
  const Icon = def?.icon ?? CircleHelp
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def?.accent ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// A single editor field for a node property. Renders as a multi-line
// textarea when the field is marked `multiline`, otherwise a single-line input.
function FieldInput({
  field,
  value,
  onChange,
  onFocus,
  error,
  errorMessage,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  error?: boolean
  errorMessage?: string
}) {
  const inputClassName = cn(
    error &&
      "border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/50"
  )

  if (field.multiline) {
    return (
      <>
        <Textarea
          id={field.key}
          value={value}
          placeholder={field.placeholder}
          className={inputClassName}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          aria-invalid={error}
        />
        {error && errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
      </>
    )
  }

  return (
    <>
      <Input
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        className={inputClassName}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        aria-invalid={error}
      />
      {error && errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </>
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const updateNodeData = useMutation(
    ({ storage }, nodeId: string, values: Record<string, string>) => {
      const liveNodes = storage.get("nodes")
      const liveNode = liveNodes.find((n) => n.get("id") === nodeId)
      if (liveNode) {
        const data = liveNode.get("data")
        liveNode.set("data", { ...data, values })
      }
    },
    []
  )

  const connections = useUpstreamConnections(node?.id)
  const [lastFocusedField, setLastFocusedField] = useState<string | undefined>(
    undefined
  )

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  const handleFieldFocus = (fieldKey: string) => {
    setLastFocusedField(fieldKey)
  }

  const handleChipClick = (token: string) => {
    const targetField = lastFocusedField ?? def.fields[0]?.key
    if (!targetField) return

    updateNodeData(node.id, {
      ...values,
      [targetField]: (values[targetField] ?? "") + token,
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => {
            const fieldValue = values[field.key] ?? ""
            const isUrlError =
              type === "open-url" &&
              field.key === "url" &&
              fieldValue.trim() !== "" &&
              !isValidUrl(fieldValue)

            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                </Label>
                <FieldInput
                  field={field}
                  value={fieldValue}
                  error={isUrlError}
                  errorMessage={isUrlError ? URL_ERROR_MESSAGE : undefined}
                  onChange={(value) => {
                    updateNodeData(node.id, {
                      ...values,
                      [field.key]: value,
                    })
                  }}
                  onFocus={() => handleFieldFocus(field.key)}
                />
              </div>
            )
          })
        )}

        {connections.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Connections</Label>
            <div className="flex flex-wrap gap-1.5">
              {connections.map((conn) => {
                const Icon = nodeRegistry[conn.nodeType].icon
                return (
                  <Button
                    key={conn.token}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-auto gap-1.5 px-2 py-1 text-xs"
                    onClick={() => handleChipClick(conn.token)}
                  >
                    <Icon className="size-3" />
                    {conn.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions = Object.values(nodeRegistry)

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette({ onAdd }: { onAdd: (type: NodeType) => void }) {
  const add = (type: NodeType) => {
    onAdd(type)
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// The "..." menu for workflow-level actions.
function ActionsMenu({ workflowId }: { workflowId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    try {
      await deleteWorkflowAction(workflowId)
      router.push("/")
    } catch {
      toast.error("Failed to delete workflow")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          onSelect={handleDelete}
        >
          <Trash2 />
          Delete workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Kicks off a run of the current workflow.
function RunButton({ workflowId }: { workflowId: string }) {
  const [isRunning, setIsRunning] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)

  const storageNodes = useStorage((root) => root.nodes)
  const storageEdges = useStorage((root) => root.edges)
  const { isLive } = useLatestRunSteps()

  const handleRun = async () => {
    if (activeRunId) {
      try {
        await cancelWorkflowRunAction(activeRunId)
        toast.info("Workflow run cancelled")
      } catch {
        toast.error("Failed to cancel workflow run")
      } finally {
        setActiveRunId(null)
        setIsRunning(false)
      }
      return
    }

    setIsRunning(true)
    try {
      const nodes = (storageNodes ?? []).map((node) => ({
        id: node.id,
        type: node.type as "step",
        position: node.position,
        data: node.data as StepNodeData,
      }))

      const edges = (storageEdges ?? []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }))

      const res = await runWorkflowAction({
        workflowId,
        graph: { nodes, edges },
      })

      setActiveRunId(res.runId)
      toast.success(`Workflow run triggered! (Run ID: ${res.runId})`)
    } catch (error) {
      console.error("Run workflow error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to run workflow"
      )
      setIsRunning(false)
    }
  }

  useEffect(() => {
    if (activeRunId && !isLive) {
      // Defer the state reset so it doesn't run synchronously inside the effect
      // commit phase (React 19 warns this "can trigger cascading renders").
      queueMicrotask(() => {
        setIsRunning(false)
        setActiveRunId(null)
      })
    }
  }, [isLive, activeRunId])

  return (
    <Button
      size="sm"
      variant={isRunning ? "destructive" : "secondary"}
      onClick={handleRun}
      disabled={isRunning && !activeRunId}
    >
      {isRunning ? (
        activeRunId ? (
          <>
            <SquareIcon className="size-3.5 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Loader2Icon className="size-3.5 animate-spin" />
            Starting...
          </>
        )
      ) : (
        <>
          <Play className="size-3.5 fill-primary text-primary" />
          Run
        </>
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")

  const { screenToFlowPosition } = useReactFlow()

  const addNode = useMutation(
    ({ storage }, type: NodeType) => {
      const def = nodeRegistry[type]
      const liveNodes = storage.get("nodes")

      // Only one trigger node is allowed
      if (def.kind === "trigger") {
        const hasTrigger = liveNodes.some(
          (n) => n.get("data").kind === "trigger"
        )
        if (hasTrigger) {
          toast.error("Only one trigger node is allowed")
          return
        }
      }

      // Number nodes of the same type so they're easy to tell apart
      const count = liveNodes.filter((n) => n.get("data").type === type).length
      const title = count === 0 ? def.label : `${def.label} ${count + 1}`

      // Place the new node at the center of the current viewport, with a small cascade offset
      const center = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      const position = { x: center.x + count * 40, y: center.y + count * 40 }

      const newNode = new LiveObject({
        id: crypto.randomUUID(),
        type: "step",
        position,
        data: {
          type,
          kind: def.kind,
          title,
          values: {},
        },
      })
      liveNodes.push(newNode)
    },
    [screenToFlowPosition]
  )

  // Track the selected node ID from React Flow selection changes.
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: StepNodeType[] }) => {
      setSelectedId(nodes[0]?.id)
    },
    []
  )

  useOnSelectionChange({ onChange: onSelectionChange })

  // Read the selected node data from Liveblocks storage.
  const selected = useStorage((root) => {
    if (!selectedId) return undefined
    const node = root.nodes.find((n) => n.id === selectedId)
    if (!node) return undefined
    return {
      id: node.id,
      type: node.type as "step",
      position: node.position,
      data: node.data as StepNodeData,
    } as StepNodeType
  })

  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette onAdd={addNode} />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
