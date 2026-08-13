import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import type { WorkflowGraph } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { validateGraph } from "./lib/validate-graph";


const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function normalizeWorkflow<T extends { graph?: WorkflowGraph | null }>(workflow: T | null): T | null {
  if (!workflow) return null;
  return {
    ...workflow,
    graph: workflow.graph ?? { nodes: [], edges: [] },
  };
}

export async function createWorkflow(orgId: string, name: string) {
  const [workflow] = await db
    .insert(workflows)
    .values({ orgId, name, graph: { nodes: [], edges: [] } })
    .returning();

  if (!workflow) {
    throw new Error("Failed to create workflow");
  }

  return normalizeWorkflow(workflow)!;
}

export async function getWorkflowsByOrg(orgId: string) {
  const list = await db.select().from(workflows).where(eq(workflows.orgId, orgId));
  return list.map((wf) => normalizeWorkflow(wf)!);
}

export async function getWorkflowById(id: string) {
  if (!isValidUuid(id)) {
    console.warn(`[workflows] getWorkflowById: invalid UUID format`, { id });
    return null;
  }

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, id));

  if (!workflow) {
    console.warn(`[workflows] getWorkflowById: not found in DB`, { id });
  }

  return normalizeWorkflow(workflow ?? null);
}

export async function getWorkflow(workflowId: string, orgId: string) {
  if (!isValidUuid(workflowId)) {
    console.warn(`[workflows] getWorkflow: invalid UUID format`, { workflowId, orgId });
    return null;
  }

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.orgId, orgId)));

  if (!workflow) {
    // Scoped lookup miss — log without alarming; the page.tsx caller will try
    // the unscoped fallback before declaring not-found.
    console.debug(`[workflows] getWorkflow: org-scoped miss`, { workflowId, orgId });
  }

  return normalizeWorkflow(workflow ?? null);
}

export async function deleteWorkflow(orgId: string, id: string) {
  if (!isValidUuid(id)) return;
  await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)));
}

export async function saveWorkflowGraph({
  orgId,
  id,
  graph,
}: {
  orgId: string;
  id: string;
  graph: WorkflowGraph;
}) {
  if (!isValidUuid(id)) {
    throw new Error(`Invalid workflow ID format: "${id}"`);
  }

  const problems = validateGraph(graph);

  if (problems.length > 0) {
    throw new Error(`Invalid workflow graph: ${problems.join(", ")}`);
  }

  await db
    .update(workflows)
    .set({ graph, updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)));
}
