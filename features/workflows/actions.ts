"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tasks } from "@trigger.dev/sdk";
import type { helloWorldTask } from "@/trigger/example";
import { createWorkflow } from "./data";

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("No organization selected");
  }

  const workflow = await createWorkflow(orgId, name);

  revalidatePath("/", "layout");
  redirect(`/workflows/${workflow.id}`);
}

export async function runWorkflowAction(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: `Running workflow: ${workflowId}`,
  });

  revalidatePath(`/workflows/${workflowId}`);

  return {
    runId: handle.id,
  };
}
