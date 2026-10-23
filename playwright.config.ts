import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  fullyParallel: true,
  workers: 3,
  reporter: "list",
  outputDir: "/tmp/reui-pro-block-playwright",
  use: {
    baseURL: process.env.PREVIEW_URL || "http://127.0.0.1:5173",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        // CI builds dist first, then tests the exact assets that Pages will publish.
        command: isCI
          ? "npm run preview -- --host 127.0.0.1 --port 5173 --strictPort"
          : "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !isCI,
      },
});
