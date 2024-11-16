import { defineConfig, devices } from "@playwright/test";
import env from "./src/env";

export default defineConfig({
  testDir: "src/",
  testMatch: "**/?(*.)+(test).ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : "25%",
  reporter: "html",
  use: {
    baseURL: env.TEST_APP_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
