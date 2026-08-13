import { useMemo } from "react"
import { useReactFlow } from "@xyflow/react"
import { useStorage } from "@liveblocks/react/suspense"
import { nodeRegistry, type NodeType, type NodeOutput } from "../nodes/node-registry"

export type UpstreamConnection = {
  token: string
  label: string
  nodeType: NodeType
  output: NodeOutput
}

function getAllUpstreamNodeIds(
  nodeId: string,
  edges: Array<{ id: string; source: string; target: string }>
): string[] {
  const upstream = new Set<string>()
  const queue = [nodeId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const edge of edges) {
      if (edge.target === current && !upstream.has(edge.source)) {
        upstream.add(edge.source)
        queue.push(edge.source)
      }
    }
  }

  return Array.from(upstream)
}

export function useUpstreamConnections(selectedNodeId: string | undefined): UpstreamConnection[] {
  const { getNodes } = useReactFlow()
  const storageEdges = useStorage((root) => root.edges)

  return useMemo(() => {
    if (!selectedNodeId) return []

    const edges = (storageEdges ?? []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }))

    const upstreamNodeIds = getAllUpstreamNodeIds(selectedNodeId, edges)

    const connections: UpstreamConnection[] = []

    for (const upstreamId of upstreamNodeIds) {
      const flowNode = getNodes().find((n) => n.id === upstreamId)
      if (!flowNode || flowNode.type !== "step") continue

      const nodeType = flowNode.data.type as NodeType
      const def = nodeRegistry[nodeType]
      const nodeTitle = flowNode.data.title || nodeType

      for (const output of def.outputs ?? []) {
        connections.push({
          token: `{{ ${upstreamId}.${output.path} }}`,
          label: `${nodeTitle} · ${output.label}`,
          nodeType,
          output,
        })
      }
    }

    return connections
  }, [selectedNodeId, storageEdges, getNodes])
}