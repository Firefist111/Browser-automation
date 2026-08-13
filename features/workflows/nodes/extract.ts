import type { Stagehand } from "@browserbasehq/stagehand"

export type ExtractResult = {
  /** The extracted text from the page (Stagehand's default extract schema). */
  result: string
}

/**
 * Extract node executor — uses Stagehand's AI-powered `extract()` to pull
 * information off the current page described by a natural-language instruction.
 *
 * Operates on the active page of the shared Stagehand session (the same one
 * `openUrl`/`act` navigate), so an `open-url` (or `act`) node should run first
 * to land on a page to extract from.
 */
export async function extract({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}): Promise<ExtractResult> {
  const data = await stagehand.extract(instruction)
  return { result: data.extraction }
}
