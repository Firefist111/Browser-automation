"use client"

import { useCallback, useState } from "react"
import { MoreHorizontal, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { LiveObject } from "@liveblocks/client"
import { useMutation, useStorage } from "@liveblocks/react/suspense"
import { useReactFlow, useOnSelectionChange } from "@xyflow/react"
import { deleteWorkflowAction } from "@/features/workflows/actions"

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

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas.
function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
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
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
}) {
  if (field.multiline) {
    return (
      <Textarea
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <Input
      id={field.key}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
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

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
              </Label>
              <FieldInput
                field={field}
                value={values[field.key] ?? ""}
                onChange={(value) => {
                  updateNodeData(node.id, {
                    ...values,
                    [field.key]: value,
                  })
                }}
              />
            </div>
          ))
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
function RunButton() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        // TODO: validate the graph and run the workflow (toggle to Stop while running).
      }}
    >
      <Play fill="primary" />
      Run
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
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="size-full gap-0"
      >
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton />
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