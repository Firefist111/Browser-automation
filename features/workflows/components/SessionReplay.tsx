"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { Loader2, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

type ReplayResponse =
  | { status: "ready"; playlist: string; pageId: string; url: string }
  | { status: "not-ready" }

type SessionReplayProps = {
  /** Browserbase session ID whose recording should be played back. */
  sessionId: string
  className?: string
}

/** How often to re-poll the not-ready endpoint. */
const POLL_INTERVAL_MS = 3_000
/** Give up after ~2 minutes of polling. */
const MAX_POLL_ATTEMPTS = 40

/**
 * Polls the server-side `/api/replays/[sessionId]` proxy until the Browserbase
 * recording is ready, then plays the HLS playlist with hls.js.
 *
 * The Browserbase segment URLs are pre-signed CDN links valid for 6 hours, so
 * the browser fetches them directly — no proxying of the actual video segments
 * through our servers.
 */
export function SessionReplay({ sessionId, className }: SessionReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    sessionId ? "loading" : "error",
  )
  const [errorMsg, setErrorMsg] = useState<string | undefined>(
    sessionId ? undefined : "No session ID provided",
  )
  const [attempts, setAttempts] = useState(0)

  // Poll until ready, then initialise hls.js (or native HLS as fallback).
  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let attempt = 0

    const poll = async () => {
      attempt++
      setAttempts(attempt)

      try {
        const res = await fetch(`/api/replays/${sessionId}`)

        if (!res.ok) {
          if (cancelled) return
          const body = await res.text().catch(() => "")
          setStatus("error")
          setErrorMsg(
            `HTTP ${res.status}${body ? `: ${body}` : ""}`,
          )
          return
        }

        const data = (await res.json()) as ReplayResponse
        if (cancelled) return

        if (data.status === "not-ready") {
          if (attempt < MAX_POLL_ATTEMPTS) {
            setTimeout(poll, POLL_INTERVAL_MS)
          } else {
            setStatus("error")
            setErrorMsg(
              `Recording not available after ${MAX_POLL_ATTEMPTS} attempts. Try again in a few minutes.`,
            )
          }
          return
        }

        // status === "ready" — wrap the m3u8 body in a Blob URL.
        const blob = new Blob([data.playlist], {
          type: "application/vnd.apple.mpegurl",
        })
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url

        const video = videoRef.current
        if (!video) {
          setStatus("error")
          setErrorMsg("Video element not ready")
          return
        }

        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void video.play().catch(() => {
              /* autoplay blocked — user can press play */
            })
          })

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("HLS error:", data)
            if (data.fatal) {
              setStatus("error")
              setErrorMsg("A fatal HLS playback error occurred")
            }
          })

          hls.loadSource(url)
          hls.attachMedia(video)
        } else if (
          video.canPlayType("application/vnd.apple.mpegurl")
        ) {
          // Safari / iOS: native HLS
          video.src = url
          void video.play().catch(() => {})
        } else {
          setStatus("error")
          setErrorMsg(
            "Browser does not support HLS playback. Try Chrome, Edge, or Safari.",
          )
        }

        setStatus("ready")
      } catch (err) {
        if (cancelled) return
        setStatus("error")
        setErrorMsg(err instanceof Error ? err.message : String(err))
      }
    }

    poll()

    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [sessionId])

  // ── Render ──────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-destructive bg-destructive/5 p-3 text-sm text-destructive",
          className,
        )}
      >
        <CircleAlert className="h-4 w-4" />
        <span>{errorMsg ?? "Something went wrong"}</span>
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-lg bg-black", className)}>
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          <span className="text-xs">
            Waiting for recording… ({attempts}/{MAX_POLL_ATTEMPTS})
          </span>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        muted
        playsInline
        className="h-full w-full max-w-full object-contain"
      />
    </div>
  )
}
