import toposort from "toposort"
import type { WorkflowGraph } from "@/lib/db/schema"

export function validateGraph({ nodes, edges }: WorkflowGraph): string[] {
  const problems: string[] = []

  // check for a single start node

  const startNodes = nodes.filter((node) => node.data.kind === "trigger").length

  if (startNodes !== 1) {
    problems.push("Workflow must have exactly one start node")
  }

  if (nodes.length === 0) {
    problems.push("Workflow must have at least one node")
  }

  if (edges.length === 0) {
    problems.push("Connect the nodes with edges to form a valid workflow")
  }
  try {
    toposort(edges.map((edge) => [edge.source, edge.target]))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("Cyclic") || msg.includes("cycle")) {
      problems.push("Workflow contains a cycle (loop). Cyclic workflows are not supported.")
    } else {
      problems.push("Workflow contains an invalid connection cycle.")
    }
  }

  return problems
}
