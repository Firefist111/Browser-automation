import type { Stagehand } from "@browserbasehq/stagehand"

export type ActResult = {
  worked: boolean
  message: string
  url: string
}

/**
 * Act node executor — uses Stagehand's AI-powered `act()` to perform a natural
 * language instruction (click, type, scroll, etc.) on the active page.
 */
export async function act({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}): Promise<ActResult> {
  // Ensure there is an active page in the current Stagehand context before
  // calling `act()`. Some workflows start with `act` directly (no preceding
  // `open-url`), and fresh sessions may not have a default page yet.
  let pages: ReturnType<Stagehand["context"]["pages"]> | undefined
  try {
    pages = stagehand.context.pages()
  } catch {
    // context may not be initialized yet; ignore and fall through.
  }

  if (!pages || pages.length === 0) {
    try {
      await stagehand.context.newPage()
    } catch {
      // If a page still cannot be created, let `stagehand.act` fail with its
      // own error downstream rather than masking the cause here.
    }
  }

  const result = await stagehand.act(instruction)

  // Capture the resulting URL from the active page (if any) so downstream nodes
  // can reference `{{ <nodeId>.url }}`. Stagehand re-uses a single browser
  // context/session across nodes, the same one `openUrl` navigates.
  let url = ""
  try {
    const activePages = stagehand.context.pages()
    const page = activePages.length > 0 ? activePages[0] : undefined
    if (page) url = page.url()
  } catch {
    // The context may not have a page yet; leave the URL empty.
  }

  return {
    worked: result.success,
    message: result.message,
    url,
  }
}
