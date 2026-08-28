import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { makeUserInfo } from "@math3d/mock-api";

test.describe("Account deletion", () => {
  test.use({ user: makeUserInfo() });

  test("A signed-in user can delete their own account", async ({ page }) => {
    const app = new AppPage(page);
    await page.goto("");

    await test.step("Submit the delete form", async () => {
      await app.userMenu().activate("settings");
      const form = app.userSettings().deleteAccountForm();
      await form.activate();
      // The backend ignores this (the session is the gate), but the SPA's yup
      // schema still marks it required, and a dummy user has no password.
      // The field goes with the form in the removal PR.
      await form.password().fill("ignored");
      await form.confirm().fill("Yes, permanently delete");
      await form.submit().click();
    });

    await test.step("Verify the account is gone", async () => {
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading")).toContainText(
        "Account Deleted",
      );
      await dialog.getByRole("button", { name: "OK" }).click();
      await app.assertSignedOut();
    });
  });
});
