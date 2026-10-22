import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
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
        command: "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: true,
      },
});
