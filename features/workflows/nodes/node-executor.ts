import type { Stagehand } from "@browserbasehq/stagehand"

import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflows/nodes/node-registry"
import { openUrl } from "./open-url"
import { act } from "./act"
import { extract } from "./extract"
import { observe } from "./observe"
import { agent } from "./agent"
import { sendEmail } from "./send-email"

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) => {
    const url = values.url?.trim()
    if (!url) {
      throw new Error(
        "Open URL node requires a URL. Configure it in the node settings."
      )
    }
    return openUrl({ stagehand: await getStagehand(), url })
  },
  act: async ({ values, getStagehand }) => {
    const instruction = values.instruction?.trim()
    if (!instruction) {
      throw new Error(
        "Act node requires an instruction. Configure it in the node settings."
      )
    }
    return act({ stagehand: await getStagehand(), instruction })
  },
  extract: async ({ values, getStagehand }) => {
    const instruction = values.instruction?.trim()
    if (!instruction) {
      throw new Error(
        "Extract node requires an instruction. Configure it in the node settings."
      )
    }
    return extract({ stagehand: await getStagehand(), instruction })
  },
  observe: async ({ values, getStagehand }) => {
    const instruction = values.instruction?.trim()
    if (!instruction) {
      throw new Error(
        "Observe node requires an instruction. Configure it in the node settings."
      )
    }
    return observe({ stagehand: await getStagehand(), instruction })
  },
  agent: async ({ values, getStagehand }) => {
    const instruction = values.instruction?.trim()
    if (!instruction) {
      throw new Error(
        "Agent node requires an instruction. Configure it in the node settings."
      )
    }
    return agent({ stagehand: await getStagehand(), instruction })
  },
  "send-email": async ({ values }) => {
    const to = values.to?.trim()
    const subject = values.subject?.trim()
    const body = values.body?.trim()

    if (!to) {
      throw new Error(
        "Send Email node requires a recipient. Configure it in the node settings."
      )
    }
    if (!subject) {
      throw new Error(
        "Send Email node requires a subject. Configure it in the node settings."
      )
    }
    if (!body) {
      throw new Error(
        "Send Email node requires a body. Configure it in the node settings."
      )
    }

    // Unlike the other action nodes, this does not use Stagehand — it is a pure
    // server-side Resend API call with no browser session.
    return sendEmail({ to, subject, body })
  },
} satisfies Record<ActionNodeType, NodeExecutor>
