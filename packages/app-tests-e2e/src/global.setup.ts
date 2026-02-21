import { test as setup, expect } from "@playwright/test";
import env from "@/env";
import { getInbox } from "./utils/inbox/emails";

const inbox = getInbox();

setup("Clear emails", async () => {
  await inbox.deleteAll();
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
