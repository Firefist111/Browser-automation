# Browser Automation

A browser automation tool built on [Stagehand V3](https://docs.stagehand.dev) (AI-powered `act`, `extract`, `observe`, `agent`) with a Trigger.dev workflow engine and a Next.js dashboard for building, running, and replaying browser sessions.

## Features

- **Visual workflow builder** — Compose multi-step browser automations with a canvas UI. Nodes for `open-url`, `act`, `observe`, `extract`, `agent`, `send-email`, and more.
- **Trigger.dev tasks** — Long-running browser workflows execute as durable tasks (queue, retries, scheduling) via `@trigger.dev/sdk`.
- **Browserbase** — Headless browser sessions via the Browserbase SDK, with session recording, live view, logs, and downloads.
- **Session replay** — Retrieve a session's recording as an HLS playlist through a server-side proxy and play it back with hls.js.
- **Liveblocks** — Real-time shared canvas/room state across collaborators.
- **Clerk** — Authentication and organization-scoped access control.
- **Resend** — Email delivery for notifications and automations.

## Project structure

```
browser-automation/
├── app/
│   ├── api/
│   │   ├── replays/[sessionId]/route.ts   # Server-side proxy for Browserbase HLS playlists
│   │   ├── workflows/[id]/route.ts         # Workflow metadata API
│   │   └── liveblocks-auth/route.ts        # Liveblocks access-token endpoint
│   ├── (dashboard)/workflows/              # Dashboard routes
│   ├── layout.tsx                          # Root layout (Clerk + providers)
│   └── next.config.ts
├── features/workflows/
│   ├── actions.ts                  # Server actions
│   ├── data.ts                     # Workflow DB layer (Drizzle)
│   ├── nodes/                      # Node executors (act, agent, extract, …)
│   │   └── node-registry.ts
│   ├── components/
│   │   ├── SessionReplay.tsx        # Polling HLS.js player component
│   │   ├── ConsolePanel.tsx
│   │   ├── LogsPanel.tsx
│   │   └── …
│   ├── hooks/                      # React hooks
│   └── lib/                        # Helpers (interpolate, urls, validate-graph)
├── lib/
│   └── db/                         # Drizzle DB client + schema
├── trigger/                        # Trigger.dev task definitions
│   ├── example.ts
│   └── config.ts
├── drizzle/                        # Drizzle migrations
├── scripts/                        # Verification & setup scripts
└── skills/                         # Installed Kilo agent skills
```

## Prerequisites

- Node.js 18+ (recommended: [Node 20 LTS](https://nodejs.org))
- A PostgreSQL database (local or hosted)
- Accounts with the following services:
  - [Browserbase](https://browserbase.com) — for headless sessions & recordings
  - [Clerk](https://clerk.com) — authentication
  - [Trigger.dev](https://trigger.dev) — background task orchestration
  - [Liveblocks](https://liveblocks.com) — real-time collaboration
  - [Resend](https://resend.com) — email (optional)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Firefist111/Browser-automation.git
cd Browser-automation
npm install
```

### 2. Configure environment variables

Create `.env.local` based on `.env`:

```bash
touch .env.local
```

Required variables:

| Variable                  | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string (Drizzle)                  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key from the Clerk dashboard   |
| `CLERK_SECRET_KEY`        | Clerk secret key                                        |
| `BROWSERBASE_API_KEY`     | Browserbase secret API key (needed for replay proxy)    |
| `TRIGGER_SECRET_KEY`      | Trigger.dev secret key (see AGENTS.md)                  |
| `LIVEBLOCKS_SECRET_KEY`   | Liveblocks secret key                                   |
| `RESEND_API_KEY`          | Resend API key (optional)                               |
| `OPENAI_API_KEY`          | OpenAI key for Stagehand AI models                      |
| `GEMINI_API_KEY`          | (optional) Google Gemini key for agent execution        |

### 3. Set up the database

```bash
npm run db:generate   # Generate a new migration
npm run db:push       # Push schema to your database
```

To inspect data locally:

```bash
npm run db:studio
```

### 4. (Optional) Verify your environment

```bash
npm run verify
```

This runs `scripts/verify-all.ts`, which checks that all required environment variables are set and that Stagehand can perform a basic browser action.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Running Trigger.dev locally

Trigger.dev's dev server must be running for task execution:

```bash
npx trigger.dev@latest dev
```

The MCP server is configured in `.vscode/mcp.json` (dev-only — not committed to the repo).

### Database migrations

```bash
npm run db:generate   # Create a migration after editing drizzle schema
npm run db:push       # Apply migrations
npm run db:studio     # Open the Drizzle Studio UI
```

## Building for production

```bash
npm run build
npm run start
```

## Project conventions (see AGENTS.md)

- Stagehand `act` instructions should be **atomic and specific** — one action per call.
- Use the **Observe + Act** pattern to cache candidate actions before executing.
- Browserbase observability (records, replays, logs) comes from the `@browserbasehq/sdk`, not Stagehand.
- Session replay retrieval requires the secret `BROWSERBASE_API_KEY` and is proxied server-side via `app/api/replays/[sessionId]`.
- Environment files (`.env`, `.env.local`) are git-ignored by default and can be committed selectively if needed.

## Useful links

- [Stagehand docs](https://docs.stagehand.dev)
- [Browserbase observability](https://docs.browserbase.com/platform/browser/observability)
- [Browserbase session replay](https://docs.browserbase.com/platform/browser/observability/session-replay)
- [Trigger.dev docs](https://trigger.dev/docs)
- [Liveblocks docs](https://liveblocks.com/docs)
- [Clerk docs](https://clerk.com/docs)
- [shadcn/ui](https://ui.shadcn.com/docs)
