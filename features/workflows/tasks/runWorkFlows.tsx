import { logger, task } from "@trigger.dev/sdk";
import { getWorkflow } from "../data";
import toposort from "toposort";

export const runWorkflowtask = task({
    id: "run-workflow",
    run: async ({ workflowId, orgId }: { workflowId: string, orgId: string }) => {
        const workflow = await getWorkflow(workflowId, orgId)
        if (!workflow?.graph) {
            throw new Error("Workflow not found")
        }
        logger.log("Workflow found", { workflow })

        const { edges, nodes } = workflow.graph;

        const byId = new Map(nodes.map((node) => [node.id, node]))

        const connected = new Set(edges.flatMap(e => [e.source, e.target]))

        const order = toposort.array(
            nodes.map(n => n.id),
            edges.map(e => [e.source, e.target])
        )
            .filter((id) => connected.has(id))

        logger.log("Workflow order steps", { steps: order.length })


        for (const id of order) {
            const node = byId.get(id)!

            logger.log(`Executing step : ${node.id}`, {
                id: node.id,
                type: node.type,
                data: node.data
            })

        }
        return { steps: order.length }
    }

})