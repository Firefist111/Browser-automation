import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createWorkflow(orgId: string, name: string) {
  const [workflow] = await db
    .insert(workflows)
    .values({ orgId, name })
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

export async function deleteWorkflow(id: string) {
  await db.delete(workflows).where(eq(workflows.id, id));
}
