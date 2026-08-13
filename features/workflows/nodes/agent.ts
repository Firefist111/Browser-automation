import type { Stagehand } from "@browserbasehq/stagehand"

export type AgentResult = {
  succeeded: boolean
  message: string
  completed: boolean
}

/**
 * Agent node executor — runs an autonomous, multi-step browser task via
 * Stagehand's AI agent, from a single natural-language instruction.
 *
 * Operates on the active page/session of the shared Stagehand context (the
 * same one `openUrl`/`act`/`observe` navigate), so an `open-url` node should
 * run first to provide a starting page for the agent.
 */
export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}): Promise<AgentResult> {
  const result = await stagehand.agent({ stream: false }).execute(instruction)
  return {
    succeeded: result.success,
    message: result.message,
    completed: result.completed,
  }
}
