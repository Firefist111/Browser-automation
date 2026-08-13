"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type { runWorkflowTask, RunStep } from "../tasks/runWorkFlows"

export type WorkflowRun = {
  id: string
  status: string
  isQueued: boolean
  isExecuting: boolean
  createdAt?: Date | string
  steps?: RunStep[]
  metadata?: Record<string, unknown>
  browserbaseSessionId?: string
}

type WorkflowRunsContextValue = {
  /** Every run tagged for this workflow, newest first. */
  runs: WorkflowRun[]
  latestRun: WorkflowRun | null
  isLive: boolean
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue>({
  runs: [],
  latestRun: null,
  isLive: false,
})

export function WorkflowRunsProvider({
  workflowId,
  publicAccessToken,
  children,
}: {
  workflowId: string
  publicAccessToken: string
  children: ReactNode
}) {
  // Subscribe (via Trigger.dev realtime) to every run tagged for this workflow.
  // The tag matches the one set in runWorkflowAction ("workflow:<id>") and is the
  // same scope the read-only public token was minted against.
  const tag = `workflow:${workflowId}`

  const { runs } = useRealtimeRunsWithTag<typeof runWorkflowTask>(tag, {
    accessToken: publicAccessToken,
    enabled: !!workflowId && !!publicAccessToken,
    skipColumns: ["payload"],
  })

  // Normalize every run tagged for this workflow, newest first. Each run carries
  // its steps (recorded by the task in metadata) so the console can render a list
  // of runs and drill into any step's output/error/duration.
  const normalizedRuns = useMemo<WorkflowRun[]>(() => {
    if (!runs || runs.length === 0) return []

    const sorted = [...runs].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })

    return sorted.map((run) => ({
      id: run.id,
      status: run.status,
      isQueued: run.isQueued,
      isExecuting: run.isExecuting,
      createdAt: run.createdAt,
      steps: run.metadata?.steps as RunStep[] | undefined,
      metadata: run.metadata as Record<string, unknown> | undefined,
      browserbaseSessionId:
        (run.output as { browserbaseSessionId?: string } | undefined)
          ?.browserbaseSessionId ??
        (run.metadata?.["browserbaseSessionId"] as string | undefined),
    }))
  }, [runs])

  const latestRun = normalizedRuns[0] ?? null

  const isLive = latestRun ? latestRun.isQueued || latestRun.isExecuting : false

  const value = useMemo<WorkflowRunsContextValue>(
    () => ({ runs: normalizedRuns, latestRun, isLive }),
    [normalizedRuns, latestRun, isLive]
  )

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

export function useLatestRunSteps() {
  const { latestRun, isLive } = useContext(WorkflowRunsContext)

  return {
    steps: latestRun?.steps,
    isLive,
    runId: latestRun?.id ?? null,
    browserbaseSessionId: latestRun?.browserbaseSessionId ?? null,
  }
}

/**
 * Access every run for the current workflow plus the latest one. The run console
 * uses `runs` to render the full history; each run's `steps` hold the per-node
 * type/title, status, duration, output, and error recorded during execution.
 */
export function useWorkflowRuns() {
  const { runs, latestRun, isLive } = useContext(WorkflowRunsContext)

  return {
    runs,
    latestRun,
    isLive,
  }
}