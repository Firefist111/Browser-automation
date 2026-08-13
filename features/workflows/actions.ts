"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runs, tasks } from "@trigger.dev/sdk";
import { auth as triggerAuth } from "@trigger.dev/sdk/v3";
import { Liveblocks } from "@liveblocks/node";
import { createWorkflow, deleteWorkflow, saveWorkflowGraph } from "./data";
import type { WorkflowGraph } from "@/lib/db/schema";
import type { runWorkflowTask } from "./tasks/runWorkFlows";

function getLiveblocksClient() {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secretKey) {
    console.warn("LIVEBLOCKS_SECRET_KEY is not defined in environment variables.");
    return null;
  }
  return new Liveblocks({ secret: secretKey });
}

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("No organization selected");
  }

  const workflow = await createWorkflow(orgId, name);

  revalidatePath("/", "layout");
  redirect(`/workflows/${workflow.id}`);
}

export async function deleteWorkflowAction(workflowId: string) {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  // Delete the workflow row from the database
  await deleteWorkflow(orgId, workflowId);

  // Delete the Liveblocks room (which stores the workflow's nodes/edges) if it exists
  const liveblocks = getLiveblocksClient();
  if (liveblocks) {
    try {
      await liveblocks.deleteRoom(workflowId);
    } catch (error) {
      console.warn(`Failed to delete Liveblocks room ${workflowId}:`, error);
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function runWorkflowAction({ workflowId, graph }: { workflowId: string; graph: WorkflowGraph }) {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  await saveWorkflowGraph({ orgId, id: workflowId, graph });
  const handle = await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    { workflowId, orgId },
    {
      // Tag runs with the canonical "workflow:<id>" tag so realtime subscriptions
      // (useRealtimeRunsWithTag) and the read token scoped to that tag can read them.
      tags: [`workflow:${workflowId}`],
    }
  );

  revalidatePath(`/workflows/${workflowId}`);

  return {
    runId: handle.id,
  };
}

export async function cancelWorkflowRunAction(runId: string) {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  await runs.cancel(runId);
}

export async function getWorkflowRunPublicToken(workflowId: string) {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        tags: [`workflow:${workflowId}`],
      },
    },
    expirationTime: "1h",
  });

  return { token };
}

export type WorkflowRunSummary = {
  id: string;
  status: string;
  isQueued: boolean;
  isExecuting: boolean;
  metadata?: Record<string, unknown>;
};

export async function getWorkflowRunsAction(workflowId: string): Promise<WorkflowRunSummary[]> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  const page = await runs.list({
    tag: `workflow:${workflowId}`,
  });

  const items = page.data ?? [];

  return items.map((item) => ({
    id: item.id,
    status: item.status,
    isQueued: item.isQueued,
    isExecuting: item.isExecuting,
    metadata: item.metadata as Record<string, unknown> | undefined,
  }));
}