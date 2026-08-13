import { logger, task, metadata } from "@trigger.dev/sdk";
import { getWorkflow } from "../data";
import toposort from "toposort";
import { Stagehand } from "@browserbasehq/stagehand";
import { nodeExecutors } from "../nodes/node-executor";
import { interpolate, type JsonValue } from "../lib/interpolate";
import path from "node:path";

export type RunStepStatus = "pending" | "running" | "done" | "failed"

/**
 * A single executed workflow step. This is what the run console shows under the
 * canvas: which node it was (for its icon/title), how it's progressing, how long
 * it took, what it produced, and any error it threw.
 */
export type RunStep = {
  id: string
  /** Node type (e.g. "open-url", "send-email") — drives the icon/title lookup. */
  type: string
  /** Human-readable node title set on the canvas. */
  title: string
  status: RunStepStatus
  /** Epoch ms when the step started running (undefined while pending). */
  startedAt?: number
  /** Epoch ms when the step reached a terminal state (done/failed). */
  finishedAt?: number
  /** Wall-clock duration of the step in milliseconds. */
  durationMs?: number
  /** Whatever the executor returned, when the step completed successfully. */
  output?: JsonValue
  /** Error message when the step threw, so the console can render it. */
  error?: string
}

export async function runWorkflow({ workflowId, orgId }: { workflowId: string; orgId: string }) {
  // Load environment variables directly from .env.local
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  } catch {
    // ignore
  }

  logger.log("Starting workflow execution", { workflowId, orgId });

  // Sync GEMINI_API_KEY to GOOGLE_API_KEY for Google AI SDK compatibility
  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
  }

  // Check if workflow exists and is valid
  const workflow = await getWorkflow(workflowId, orgId);

  if (!workflow) {
    const err = new Error(`Workflow with ID "${workflowId}" not found for organization "${orgId}"`);
    logger.error("Workflow lookup failed", { error: err.message, workflowId, orgId });
    throw err;
  }

  if (!workflow.graph || !workflow.graph.nodes || workflow.graph.nodes.length === 0) {
    const err = new Error(`Workflow "${workflow.name}" (ID: ${workflowId}) has no graph nodes configured.`);
    logger.error("Workflow graph has no nodes", { error: err.message, workflowId });
    throw err;
  }

  logger.log("Workflow graph loaded successfully", { workflowId, name: workflow.name, nodeCount: workflow.graph.nodes.length });

  // Extract nodes and edges
  const { edges, nodes } = workflow.graph;
  const byId = new Map(nodes.map((node) => [node.id, node]));

  // Topological sort to determine node execution order
  let order: string[] = [];

  if (edges && edges.length > 0) {
    try {
      const sorted = toposort.array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      );
      // Ensure all nodes in the graph are included in order
      const sortedSet = new Set(sorted);
      const remaining = nodes.map((n) => n.id).filter((id) => !sortedSet.has(id));
      order = [...sorted, ...remaining];
    } catch (err) {
      logger.warn("Topological sort warning (falling back to node order)", { error: String(err) });
      order = nodes.map((n) => n.id);
    }
  } else {
    order = nodes.map((n) => n.id);
  }

  logger.log("Workflow execution node order calculated", { stepsCount: order.length, order });

  let stagehand: Stagehand | null = null;
  let browserbaseSessionId: string | undefined;

  const createStagehand = (env: "BROWSERBASE" | "LOCAL") => {
    return new Stagehand({
      env,
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID || undefined,
      model:
        process.env.STAGEHAND_MODEL ||
        process.env.LLM_MODEL ||
        "google/gemini-2.0-flash",
      verbose: 1,
    });
  };

  const getStagehand = async () => {
    if (stagehand) return stagehand;

    const useBrowserbase = Boolean(process.env.BROWSERBASE_API_KEY);

    if (useBrowserbase) {
      try {
        stagehand = createStagehand("BROWSERBASE");
        await stagehand.init();

        console.log(`[Stagehand] Live Browserbase Session Created! ID: ${stagehand.browserbaseSessionID}, URL: ${stagehand.browserbaseSessionURL}`);
        logger.log(`Live Browserbase Session Created`, {
          sessionId: stagehand.browserbaseSessionID,
          sessionUrl: stagehand.browserbaseSessionURL,
        });

        const sessionId = stagehand.browserbaseSessionID;
        if (sessionId) {
          browserbaseSessionId = sessionId;

          // Also surface it in run metadata so the console can show a replay row
          // even if the realtime run shape doesn't include the full output.
          try {
            await metadata.set(`browserbaseSessionId`, sessionId);
            await metadata.flush();
          } catch {
            // Non-fatal: metadata is a nice-to-have, output is the source of truth.
          }
        }

        return stagehand;
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : String(err);
        logger.warn("Browserbase session creation failed, falling back to local browser", {
          error: errMsg,
        });
        console.warn(
          `[Stagehand] Browserbase session creation failed (${errMsg}), falling back to LOCAL browser`
        );
      }
    }

    // Fallback: use a local Playwright browser (bundled Chromium).
    // This ensures workflows keep running even when Browserbase quota
    // is exhausted (e.g. 402 free-plan minutes limit) or credentials
    // are unavailable.
    stagehand = createStagehand("LOCAL");
    await stagehand.init();

    return stagehand;
  };

  const results: Record<string, JsonValue> = {};
  const runSteps: RunStep[] = order.map((id) => {
    const node = byId.get(id);
    return {
      id,
      type: node?.data.type ?? "",
      title: node?.data.title ?? id,
      status: "pending",
    };
  });

  try {
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const node = byId.get(id);
      if (!node) continue;

      if (node.data.type === "start") {
        // The start trigger does no work and has no output, but it should still
        // read as completed in the console. Mark it done (0ms) and publish before
        // continuing so it doesn't sit at "pending" forever.
        const finishedAt = Date.now();
        runSteps[i].status = "done";
        runSteps[i].startedAt = finishedAt;
        runSteps[i].finishedAt = finishedAt;
        runSteps[i].durationMs = 0;
        runSteps[i].output = undefined;
        runSteps[i].error = undefined;
        await metadata.set("steps", runSteps as unknown as JsonValue);
        await metadata.flush();
        continue;
      }

      const executor = nodeExecutors[node.data.type];
      if (!executor) {
        throw new Error(`Unsupported node type: ${node.data.type}`);
      }

      const stepTitle = node.data.title || node.id;

      // Mark as running and flush immediately so the canvas sees the spinner
      runSteps[i].status = "running";
      runSteps[i].startedAt = Date.now();
      runSteps[i].error = undefined;
      await metadata.set("steps", runSteps as unknown as JsonValue);
      await metadata.flush();

      logger.log(`Executing step [${stepTitle}] (Type: ${node.data.type})`, {
        id: node.id,
        type: node.data.type,
        values: node.data.values,
      });

      const interpolatedValues = interpolate(JSON.stringify(node.data.values), results);
      const parsedValues = JSON.parse(interpolatedValues);

      try {
        const stepResult = await executor({
          values: parsedValues,
          getStagehand,
        });

        const finishedAt = Date.now();
        results[node.id] = stepResult as JsonValue;
        runSteps[i].status = "done";
        runSteps[i].finishedAt = finishedAt;
        runSteps[i].durationMs =
          finishedAt - (runSteps[i].startedAt ?? finishedAt);
        runSteps[i].output = stepResult as JsonValue;
        runSteps[i].error = undefined;

        logger.log(`Successfully completed step [${stepTitle}]`, {
          id: node.id,
          result: stepResult,
        });
      } catch (execError) {
        const finishedAt = Date.now();
        runSteps[i].status = "failed";
        runSteps[i].finishedAt = finishedAt;
        runSteps[i].durationMs =
          finishedAt - (runSteps[i].startedAt ?? finishedAt);
        runSteps[i].output = undefined;
        runSteps[i].error =
          execError instanceof Error ? execError.message : String(execError);
        await metadata.set("steps", runSteps as unknown as JsonValue);
        await metadata.flush();
        throw execError;
      }

      await metadata.set("steps", runSteps as unknown as JsonValue);
      await metadata.flush();
    }

    return { steps: runSteps, results, browserbaseSessionId };
  } catch (error) {
    // Ensure failed state is flushed before stopping
    await metadata.set("steps", runSteps as unknown as JsonValue);
    await metadata.flush();

    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(`❌ [Workflow Execution Failed]: ${errorMsg}`);
    console.error(`❌ [Workflow Execution Failed]: ${errorMsg}`);
    if (stack) {
      for (const line of stack.split("\n")) {
        logger.error(line);
        console.error(line);
      }
    }

    throw error;
  } finally {
    const activeStagehand = stagehand as Stagehand | null;
    if (activeStagehand) {
      try {
        await activeStagehand.close();
      } catch (closeErr) {
        logger.error("Failed to close Stagehand session cleanly", {
          error: closeErr instanceof Error ? closeErr.message : String(closeErr),
        });
      }
    }
  }
}

export const runWorkflowTask = task({
  id: "run-workflow",
  retry: {
    maxAttempts: 1,
  },
  run: runWorkflow,
});
