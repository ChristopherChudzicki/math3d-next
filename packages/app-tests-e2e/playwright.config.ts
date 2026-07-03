import { defineConfig, devices } from "@playwright/test";
import env from "./src/env";

export default defineConfig({
  testDir: "src/",
  testMatch: "**/?(*.)+(test).ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : "25%",
  reporter: "html",
  use: {
    baseURL: env.TEST_APP_URL,
    trace: "on-first-retry",
  },
  // Start the frontend if nothing is serving TEST_APP_URL yet. Locally an
  // already-running dev server is reused (or one is started); in CI the
  // production build from the preceding `yarn build` step is served via
  // `vite preview`.
  webServer: {
    command: process.env.CI ? "yarn preview" : "yarn start",
    url: env.TEST_APP_URL,
    reuseExistingServer: !process.env.CI,
    cwd: env.PROJECT_CWD,
    timeout: 120_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /global.setup\.ts/,
    },
    {
      // Pure-Node unit tests for the test utilities themselves: no browser and
      // no `setup` dependency. Named *.unit.ts so the default `test.ts`
      // testMatch (inherited by chromium) skips them and only this project runs
      // them.
      name: "unit",
      testMatch: /\.unit\.ts$/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
