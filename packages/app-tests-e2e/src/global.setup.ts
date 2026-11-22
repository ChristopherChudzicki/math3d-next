import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup, expect } from "@playwright/test";
import env from "@/env";
import { createActiveUser } from "@/utils/api/auth";

// This suite's checkout root (packages/app-tests-e2e/src -> repo root),
// realpath'd so symlinked checkout paths compare equal.
const checkoutRoot = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."),
);

setup("Verify the server serves this checkout", async ({ request }) => {
  const response = await request.get(env.TEST_APP_URL);
  const serverRoot = response.headers()["x-checkout-root"];
  expect(
    serverRoot,
    [
      `The server at ${env.TEST_APP_URL} sent no X-Checkout-Root header, so it`,
      "cannot be verified to serve this checkout's code. It likely predates",
      "the identity header — restart it (yarn start).",
    ].join(" "),
  ).toBeDefined();
  expect(
    serverRoot,
    [
      `The server at ${env.TEST_APP_URL} serves ${serverRoot}, but this suite`,
      `is testing ${checkoutRoot}. Stop that server, or point TEST_APP_URL at`,
      "this checkout's own server (worktrees: ./scripts/setup_worktree_env.sh).",
    ].join(" "),
  ).toBe(checkoutRoot);
});

setup("Verify a production build sends the CSP", async ({ request }) => {
  const response = await request.get(env.TEST_APP_URL);
  const html = await response.text();
  setup.skip(html.includes("/@vite/client"), "The dev server has no policy");
  expect(
    response.headers()["content-security-policy"],
    "The production build sends no Content-Security-Policy header, so the suite's CSP checks would pass vacuously. Check that the build wrote it into dist/_headers.",
  ).toBeDefined();
});

setup("Verify DISPLAY_AUTH_FLOWS is enabled", async ({ page }) => {
  await page.goto(env.TEST_APP_URL);
  const flag = await page.evaluate(
    () =>
      // @ts-expect-error Accessing test flag set in main.tsx
      window.__DISPLAY_AUTH_FLOWS__,
  );
  expect(
    flag,
    [
      "DISPLAY_AUTH_FLOWS is false in the frontend build.",
      "E2E tests require auth flows to be visible.",
      "Rebuild with VITE_DISPLAY_AUTH_FLOWS=true.",
    ].join(" "),
  ).toBe(true);
});

setup("Verify the backend mints dummy-provider sessions", async () => {
  // Every fixture signs in this way, so a backend without IS_DEPLOYMENT=False or
  // ENABLE_SIGNUP fails the whole suite. Do it once here, where the
  // diagnostic is one failure instead of one per test.
  const { cleanup } = await createActiveUser();
  await cleanup();
});
