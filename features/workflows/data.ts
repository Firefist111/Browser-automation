import { db } from "@/lib/db";
import { workflows,WorkflowGraph } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { validateGraph } from "./lib/validate-graph";


export async function createWorkflow(orgId: string, name: string) {
  const [workflow] = await db
    .insert(workflows)
    .values({ orgId, name, graph: { nodes: [], edges: [] } })
    .returning();

  return workflow;
}

export async function getWorkflowsByOrg(orgId: string) {
  return db.select().from(workflows).where(eq(workflows.orgId, orgId));
}

export async function getWorkflowById(id: string) {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, id));

  return workflow ?? null;
}

export async function getWorkflow(workflowId: string,orgId: string) {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, workflowId),eq(workflows.orgId, orgId)));

  return workflow ?? null;
}



export async function deleteWorkflow(orgId: string, id: string) {
  await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)));
}

export async function saveWorkflowGraph({orgId ,id, graph } : {
orgId: string,
id: string,
graph: WorkflowGraph
}){

const problems = validateGraph(graph)

if(problems.length > 0){
  throw new Error(`Invalid workflow graph: ${problems.join(", ")}`);
}
await db
.update(workflows)
.set({ graph })
.where(and(eq(workflows.id, id),eq(workflows.orgId, orgId)))
}
