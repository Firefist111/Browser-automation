import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_yowlxcmmxesbfackujnv",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["features/workflows/tasks"],
  build: {
    external: [
      // Stagehand and its SDK use worker threads internally
      "@browserbasehq/stagehand",
      "@browserbasehq/sdk",
      // pino uses thread-stream which spawns worker threads that load lib/worker.js
      "pino",
      "pino-pretty",
      "thread-stream",
      "sonic-boom",
      "real-require",
      // Playwright/patchright are peer deps of Stagehand and use worker threads
      "playwright-core",
      "patchright-core",
    ],
  },
});
