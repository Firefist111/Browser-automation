# Cline Rules

## Context Preservation
- When resuming after an interruption, do NOT re-read files that were already read in previous steps. Trust the context you already have.
- Only read a file if you genuinely don't have its contents in your current context window.
- If you need to recall file contents, check your own memory first before using read_file.

## Trigger.dev Setup Status (as of 2026-07-30)
- ✅ `npx trigger.dev@latest init` - DONE (trigger/example.ts and trigger.config.ts exist)
- ✅ MCP server installed to .vscode/mcp.json (project-level, dev-only)
- ✅ `npx trigger.dev@latest dev` - RUNNING in terminal
- ❌ TRIGGER_SECRET_KEY not yet set in .env.local
- ❌ Need to show how to trigger tasks from Next.js backend

## Available Trigger.dev Skills
- `trigger-config` — Configure trigger.config.ts with build extensions (Prisma, Playwright, FFmpeg, Python, etc.)
- `trigger-tasks` — Build tasks, scheduling, queues, concurrency, retries, idempotency
- `trigger-agents` — AI agent patterns (orchestration, parallelization, routing, evaluator-optimizer, human-in-the-loop)
- `trigger-setup` — Initial project setup and configuration
- `trigger-realtime` — Real-time subscriptions, React hooks, streaming AI responses, wait tokens

## Key Files
- `browser-automation/trigger/example.ts` - Hello World example task
- `browser-automation/trigger.config.ts` - Trigger.dev config
- `browser-automation/app/api/workflows/route.ts` - API routes
- `browser-automation/features/workflows/actions.ts` - Server actions
- `browser-automation/app/(dashboard)/page.tsx` - Dashboard page
- `browser-automation/app/layout.tsx` - Root layout
- `browser-automation/next.config.ts` - Next.js config
- `browser-automation/package.json` - Dependencies
- `browser-automation/.env.local` - Environment variables (no TRIGGER_SECRET_KEY yet)
- `browser-automation/.env` - Environment variables