import type { Node } from "@xyflow/react"
import {
  Bot,
  Globe,
  Database,
  Mail,
  MousePointer,
  Search,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered as an input in the inspector.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  /** When true, the field renders as a multi-line textarea instead of a single-line input. */
  multiline?: boolean
}

export type NodeOutput = {
  path: string
  label: string
  type?: "string" | "number" | "boolean" | "json"
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
  outputs?: NodeOutput[]
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Start",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [],
    outputs: [],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: Globe,
    accent: "bg-emerald-500 text-white",
    fields: [
      { key: "url", label: "URL", placeholder: "https://example.com" },
      {
        key: "description",
        label: "Description",
        placeholder: "Optional description for this step",
        multiline: true,
      },
    ],
    outputs: [
      { path: "url", label: "URL" },
      { path: "title", label: "Title" },
    ],
  },
  act: {
    type: "act",
    kind: "action",
    label: "Act",
    icon: MousePointer,
    accent: "bg-purple-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "e.g. Click the search button, Type 'hello' into the box",
        multiline: true,
      },
    ],
    outputs: [
      { path: "worked", label: "Worked" },
      { path: "message", label: "Message" },
      { path: "url", label: "URL" },
    ],
  },
  extract: {
    type: "extract",
    kind: "action",
    label: "Extract",
    icon: Database,
    accent: "bg-amber-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "e.g. Extract the titles of the search results",
        multiline: true,
      },
    ],
    outputs: [{ path: "result", label: "Result" }],
  },
  observe: {
    type: "observe",
    kind: "action",
    label: "Observe",
    icon: Search,
    accent: "bg-orange-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "e.g. Find all the links in the main navigation",
        multiline: true,
      },
    ],
    outputs: [
      { path: "matchCount", label: "Match count" },
      { path: "firstSelector", label: "First match selector" },
      { path: "firstDescription", label: "First match description" },
      { path: "actions", label: "Actions (JSON)" },
    ],
  },
  agent: {
    type: "agent",
    kind: "action",
    label: "Agent",
    icon: Bot,
    accent: "bg-fuchsia-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder:
          "e.g. Book a flight from NYC to SFO and email me the receipt",
        multiline: true,
      },
    ],
    outputs: [
      { path: "succeeded", label: "Succeeded" },
      { path: "message", label: "Message" },
      { path: "completed", label: "Completed" },
    ],
  },
  "send-email": {
    type: "send-email",
    kind: "action",
    label: "Send Email",
    icon: Mail,
    accent: "bg-sky-500 text-white",
    fields: [
      {
        key: "to",
        label: "To",
        placeholder: "recipient@example.com",
      },
      {
        key: "subject",
        label: "Subject",
        placeholder: "Email subject",
      },
      {
        key: "body",
        label: "Body",
        placeholder: "Email body",
        multiline: true,
      },
    ],
    outputs: [{ path: "id", label: "Email ID" }],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

// Plain JSON only (synced through Liveblocks).
export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType =
  "open-url" | "act" | "extract" | "observe" | "agent" | "send-email"
