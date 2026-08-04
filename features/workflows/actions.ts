"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runs, tasks } from "@trigger.dev/sdk";
import { Liveblocks } from "@liveblocks/node";
import type { helloWorldTask } from "@/trigger/example";
import { createWorkflow, deleteWorkflow, saveWorkflowGraph } from "./data";
import { WorkflowGraph } from "@/lib/db/schema";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

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
  const { userId , orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if(!orgId){
    throw new Error("No organization selected");
  }


  // Delete the workflow row from the database
  await deleteWorkflow(workflowId);

  // Delete the Liveblocks room (which stores the workflow's nodes/edges)
  await liveblocks.deleteRoom(workflowId);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function runWorkflowAction({workflowId,graph} : {workflowId: string, graph: WorkflowGraph}) {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new Error("Not authenticated")
  }

  if (!orgId) {
    throw new Error("No organization selected")
  }

  await saveWorkflowGraph({ orgId, id: workflowId, graph });
  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: `Running workflow: ${workflowId}`,
  });

  revalidatePath(`/workflows/${workflowId}`);
  
  return {
    runId: handle.id,
  };
}


export async function  cancelWorkflowRunAction(runId: string) {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new Error("Not authenticated")
  }

  if (!orgId) {
    throw new Error("No organization selected")
  }

  await runs.cancel(runId);
}