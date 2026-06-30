import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";

/**
 * The fallback error page is wired into the app's real router as the top-level
 * `errorElement`. We exercise it via the `?test-sync-error` hook, which is
 * mounted on every route (see ErrorTrigger), so this also pins that the wiring
 * actually catches render errors in a real browser.
 */
test.describe("Fallback error page", () => {
  test("renders the branded fallback when a route throws", async ({ page }) => {
    // A non-root path proves the trigger is global, and carries a custom message.
    await page.goto("/some-scene-key?test-sync-error=e2e%20trigger");

    await expect(
      page.getByRole("heading", { name: "We hit a discontinuity." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reload page" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to home" }),
    ).toHaveAttribute("href", "/");

    // The thrown message is available behind the technical-details disclosure.
    await page.getByText("Technical details").click();
    await expect(page.getByText(/e2e trigger/)).toBeVisible();

    // The report link is a prefilled GitHub "new issue" URL.
    await expect(
      page.getByRole("link", { name: /Report this bug/ }),
    ).toHaveAttribute("href", /\/issues\/new\?/);
  });
});
