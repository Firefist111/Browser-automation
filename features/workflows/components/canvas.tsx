"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  useOnSelectionChange,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"
import { LiveObject } from "@liveblocks/client"
import { useUpdateMyPresence, useOthers, useStorage, useMutation } from "@liveblocks/react/suspense"
import { StepNode } from "./step-nodes"
import { UserCursor } from "@/components/liveblocks/user-cursor"
import type { StepNodeData } from "../nodes/node-registry"

const nodeTypes = {
  step: StepNode,
}

const COLORS = [
  "#FF5F56",
  "#FFBD2E",
  "#27C93F",
  "#4A90D9",
  "#9B59B6",
  "#E67E22",
  "#1ABC9C",
  "#E74C3C",
]

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  const updateMyPresence = useUpdateMyPresence()
  const others = useOthers()

  // Read nodes and edges from Liveblocks storage
  const storageNodes = useStorage((root) => root.nodes)
  const storageEdges = useStorage((root) => root.edges)

  // Track the selected node ID so we can preserve selection when
  // Liveblocks storage updates cause React Flow to re-render.
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      setSelectedId(nodes[0]?.id)
    },
    []
  )

  useOnSelectionChange({ onChange: onSelectionChange })

  // Convert Liveblocks storage to React Flow format, preserving selection
  const nodes: Node<StepNodeData, "step">[] = useMemo(
    () =>
      (storageNodes ?? []).map((node) => ({
        id: node.id,
        type: node.type as "step",
        position: node.position,
        data: node.data as StepNodeData,
        selected: node.id === selectedId,
      })),
    [storageNodes, selectedId]
  )

  const edges: Edge[] = useMemo(
    () =>
      (storageEdges ?? []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    [storageEdges]
  )

  // Mutations to update Liveblocks storage
  const updateNodes = useMutation(
    ({ storage }, changes: NodeChange[]) => {
      const liveNodes = storage.get("nodes")
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          const node = liveNodes.find((n) => n.get("id") === change.id)
          if (node) {
            node.set("position", change.position)
          }
        } else if (change.type === "remove") {
          const index = liveNodes.findIndex((n) => n.get("id") === change.id)
          if (index !== -1) {
            liveNodes.delete(index)
          }
        }
      }
    },
    []
  )

  const updateEdges = useMutation(
    ({ storage }, changes: EdgeChange[]) => {
      const liveEdges = storage.get("edges")
      for (const change of changes) {
        if (change.type === "remove") {
          const index = liveEdges.findIndex((e) => e.get("id") === change.id)
          if (index !== -1) {
            liveEdges.delete(index)
          }
        }
      }
    },
    []
  )

  const addNewEdge = useMutation(
    ({ storage }, connection: Connection) => {
      const liveEdges = storage.get("edges")
      const newEdge = new LiveObject({
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
      })
      liveEdges.push(newEdge)
    },
    []
  )

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      updateNodes(changes)
    },
    [updateNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      updateEdges(changes)
    },
    [updateEdges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      addNewEdge(connection)
    },
    [addNewEdge]
  )

  // Track mouse movement to update presence
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      updateMyPresence({
        cursor: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      })
    },
    [updateMyPresence]
  )

  // Clear cursor when leaving the canvas
  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  // Clear cursor on unmount
  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null })
    }
  }, [updateMyPresence])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>

      {/* Render other users' cursors */}
      {others.map((other) => {
        if (other.presence.cursor == null) return null

        const color = COLORS[other.connectionId % COLORS.length]
        return (
          <UserCursor
            key={other.connectionId}
            x={other.presence.cursor.x}
            y={other.presence.cursor.y}
            color={color}
            name={other.info.name}
          />
        )
      })}
    </div>
  )
}