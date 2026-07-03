import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup, expect } from "@playwright/test";
import env from "@/env";
import { getInbox } from "./utils/inbox/emails";

const inbox = getInbox();

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

setup("Sweep stale emails", async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await inbox.deleteOlderThan(oneHourAgo);
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
