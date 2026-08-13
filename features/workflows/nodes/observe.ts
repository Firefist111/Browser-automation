import type { Stagehand } from "@browserbasehq/stagehand"

export type ObserveMatch = {
  selector: string
  description: string
  method?: string
  arguments?: string[]
}

export type ObserveResult = {
  matchCount: number
  firstSelector: string
  firstDescription: string
  actions: ObserveMatch[]
}

/**
 * Observe node executor — uses Stagehand's AI-powered `observe()` to find the
 * actionable elements on the current page that match a natural-language
 * instruction, and surfaces the matches (selector + description each) as outputs.
 *
 * Operates on the active page of the shared Stagehand session (the same one
 * `openUrl`/`act` navigate), so an `open-url` (or `act`) node should run first
 * to land on a page to observe.
 */
export async function observe({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}): Promise<ObserveResult> {
  const actions = await stagehand.observe(instruction)
  const normalized: ObserveMatch[] = (actions ?? []).map((a) => ({
    selector: a.selector,
    description: a.description,
    method: a.method,
    arguments: a.arguments,
  }))

  return {
    matchCount: normalized.length,
    firstSelector: normalized[0]?.selector ?? "",
    firstDescription: normalized[0]?.description ?? "",
    actions: normalized,
  }
}
