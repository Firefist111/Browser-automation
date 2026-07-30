"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { StepNode } from "./step-nodes"

const nodeStyles = {
  padding: "10px 20px",
  borderRadius: "8px",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "hsl(var(--border))",
  fontSize: "14px",
  fontWeight: 500,
}

const initialNodes: Node[] = [
  {
    id: "start",
    type: "step",
    data: { type: "start",kind:"trigger",title:"Start",values:{}},
    position: { x: 0, y: 0 }
  }
]

const initialEdges: Edge[] = []

const emptySubscribe = () => () => {}

const nodeTypes = {
  step: StepNode,
}

export function Canvas() {
  const { resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        colorMode={mounted && resolvedTheme === "dark" ? "dark" : "light"}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}