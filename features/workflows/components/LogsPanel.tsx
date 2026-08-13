"use client"

import prettyMs from "pretty-ms"
import { CircleX, Loader2, MonitorPlay } from "lucide-react"

import type { NodeType } from "../nodes/node-registry"
import type { RunStep } from "../tasks/runWorkFlows"
import { NodeIcon } from "./right-sidebar"
import { useWorkflowRuns } from "./WorkflowRunsProvider"
import { cn } from "@/lib/utils"

/**
 * Identifies a single selected item in the console: either one of a run's
 * steps or the run's recording ("replay"). Only one selection is active at a
 * time. State is owned by ConsolePanel.
 */
export type Selection =
  | { kind: "step"; runId: string; stepId: string }
  | { kind: "replay"; runId: string }
  | null

type LogsPanelProps = {
  selection: Selection
  onToggleStep: (runId: string, stepId: string) => void
  onToggleReplay: (runId: string) => void
}

/**
 * Lists every workflow run and, under each, its steps plus — for finished runs
 * that captured a Browserbase recording — a "Replay" row. A step row shows the
 * node's accent icon, its title, and how long it took. It spins while running,
 * turns red when it fails, and dims if it never ran.
 */
export function LogsPanel({
  selection,
  onToggleStep,
  onToggleReplay,
}: LogsPanelProps) {
  const { runs } = useWorkflowRuns()

  if (runs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No runs yet</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col divide-y divide-border overflow-y-auto">
      {runs.map((run) => {
        const steps = run.steps ?? []
        // A recording exists only once the run has finished (the session id is
        // read from the run's final output) and a session id was captured.
        const hasRecording =
          !!run.browserbaseSessionId && !run.isQueued && !run.isExecuting
        return (
          <div key={run.id} className="py-1.5">
            <div className="flex items-center justify-between gap-2 px-3 py-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {run.status}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {run.createdAt
                  ? new Date(run.createdAt).toLocaleString()
                  : run.id}
              </span>
            </div>

            <div className="flex flex-col px-2">
              {steps.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  No steps recorded
                </p>
              )}
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  runId={run.id}
                  step={step}
                  selected={selection}
                  onToggle={onToggleStep}
                />
              ))}

              {hasRecording && (
                <ReplayRow
                  runId={run.id}
                  sessionId={run.browserbaseSessionId!}
                  selected={
                    selection?.kind === "replay" &&
                    selection.runId === run.id
                  }
                  onToggle={onToggleReplay}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StepRow({
  runId,
  step,
  selected,
  onToggle,
}: {
  runId: string
  step: RunStep
  selected: Selection
  onToggle: (runId: string, stepId: string) => void
}) {
  const isSelected =
    selected?.kind === "step" &&
    selected.runId === runId &&
    selected.stepId === step.id
  const isRunning = step.status === "running"
  const isFailed = step.status === "failed"
  const isPending = step.status === "pending"

  const duration =
    step.durationMs !== undefined ? prettyMs(step.durationMs) : null

  return (
    <button
      type="button"
      onClick={() => onToggle(runId, step.id)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        isSelected && "bg-accent text-accent-foreground",
        isRunning && "text-blue-500",
        isFailed && "text-destructive",
        isPending && "opacity-50"
      )}
    >
      <NodeIcon
        type={step.type as NodeType}
        className={cn(isRunning && "animate-pulse")}
      />
      <span className="min-w-0 flex-1 truncate font-medium">
        {step.title || step.id}
      </span>

      {isRunning ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-blue-500" />
      ) : isFailed ? (
        <CircleX className="size-3.5 shrink-0 text-destructive" />
      ) : (
        duration && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {duration}
          </span>
        )
      )}
    </button>
  )
}

function ReplayRow({
  runId,
  sessionId,
  selected,
  onToggle,
}: {
  runId: string
  sessionId: string
  selected: boolean
  onToggle: (runId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(runId)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        selected && "bg-accent text-accent-foreground"
      )}
      title={`Play recording for session ${sessionId}`}
    >
      <MonitorPlay className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">Replay</span>
      <span className="shrink-0 truncate text-xs text-muted-foreground">
        {sessionId.slice(0, 8)}…
      </span>
    </button>
  )
}