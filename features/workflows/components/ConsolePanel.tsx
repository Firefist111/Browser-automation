"use client"

import { useState } from "react"
import prettyMs from "pretty-ms"

import type { NodeType } from "../nodes/node-registry"
import type { RunStep } from "../tasks/runWorkFlows"
import { LogsPanel, type Selection } from "./LogsPanel"
import { NodeIcon } from "./right-sidebar"
import { SessionReplay } from "./SessionReplay"
import { useWorkflowRuns } from "./WorkflowRunsProvider"
import { cn } from "@/lib/utils"

/**
 * The console under the canvas. Owns the selection (a step or a run's replay)
 * and renders the runs list (LogsPanel) plus a detail pane that shows either
 * the selected step's output/error or the run's recording.
 */
export function ConsolePanel() {
  const [selection, setSelection] = useState<Selection>(null)
  const { runs } = useWorkflowRuns()

  const toggleStep = (runId: string, stepId: string) => {
    setSelection((prev) =>
      prev?.kind === "step" && prev.runId === runId && prev.stepId === stepId
        ? null
        : { kind: "step", runId, stepId }
    )
  }

  const toggleReplay = (runId: string) => {
    setSelection((prev) =>
      prev?.kind === "replay" && prev.runId === runId
        ? null
        : { kind: "replay", runId }
    )
  }

  // Resolve the selected run and, when a step is selected, that step.
  const selectedRun = selection
    ? runs.find((r) => r.id === selection.runId)
    : undefined
  const selectedStep =
    selection?.kind === "step"
      ? selectedRun?.steps?.find((s) => s.id === selection.stepId)
      : undefined

  // Detail pane content (only when something is selected).
  const detail =
    selection?.kind === "replay" ? (
      <ReplayDetails sessionId={selectedRun?.browserbaseSessionId} />
    ) : selectedStep ? (
      <SelectedStepDetails step={selectedStep} />
    ) : null

  return (
    <div className="flex size-full flex-col bg-background">
      <div className="flex items-center border-b border-border px-3 py-1.5 text-sm font-semibold">
        Console
      </div>

      <div className="flex min-h-0 flex-1">
        {detail ? (
          <>
            {/* Left: runs list (shrinks to half when something is selected). */}
            <div className="min-w-0 flex-1 overflow-hidden border-r border-border">
              <LogsPanel
                selection={selection}
                onToggleStep={toggleStep}
                onToggleReplay={toggleReplay}
              />
            </div>
            {/* Right: the selected step's output/error, or the run's replay. */}
            <div className="min-w-0 flex-1 overflow-y-auto">{detail}</div>
          </>
        ) : (
          /* Full-width list until something is selected. */
          <LogsPanel
            selection={selection}
            onToggleStep={toggleStep}
            onToggleReplay={toggleReplay}
          />
        )}
      </div>
    </div>
  )
}

/** The recorded playback for a finished run, or a hint when there's none. */
function ReplayDetails({ sessionId }: { sessionId?: string }) {
  if (!sessionId) {
    return (
      <p className="p-3 text-sm text-muted-foreground">
        No recording available for this run
      </p>
    )
  }
  return (
    <div className="border-t border-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold">Recording</span>
        <span className="truncate text-xs text-muted-foreground">
          {sessionId}
        </span>
      </div>
      <SessionReplay sessionId={sessionId} className="aspect-video w-full" />
    </div>
  )
}

function SelectedStepDetails({ step }: { step: RunStep }) {
  const duration =
    step.durationMs !== undefined ? prettyMs(step.durationMs) : null
  const hasOutput = step.output !== undefined

  return (
    <div className="border-t border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <NodeIcon type={step.type as NodeType} />
        <span className="truncate text-sm font-semibold">{step.title || step.id}</span>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {duration ?? "—"}
        </span>
      </div>

      {step.error && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-destructive">Error</p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
            {step.error}
          </pre>
        </div>
      )}

      {hasOutput && (
        <div className={cn("mt-2", step.error && "opacity-90")}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Output</p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        </div>
      )}

      {!step.error && !hasOutput && (
        <p className="mt-2 text-xs text-muted-foreground">No output</p>
      )}
    </div>
  )
}