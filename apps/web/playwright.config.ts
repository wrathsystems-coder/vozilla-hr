import { defineConfig, devices } from "@playwright/test";

// Sprint 4: Chromium-only golden-path coverage. Sprint 7 polish adds
// Firefox + WebKit and parallel sharding for CI.
//
// webServer reuses an already-running `pnpm dev` so iteration stays fast;
// CI will set REUSE_DEV_SERVER=0 to start fresh.

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const reuseExistingServer = process.env.REUSE_DEV_SERVER !== "0";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL,
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
