import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { makeUserIdentity } from "@math3d/mock-api";
import { authHeaders } from "@/utils/api/auth";
import { apiFetch } from "@/utils/api/config";
import invariant from "tiny-invariant";

test.describe("Account deletion", () => {
  test.use({ user: makeUserIdentity() });

  test("A signed-in user can delete their own account", async ({
    page,
    sessionCookies,
  }) => {
    invariant(sessionCookies, "The user fixture signs this test in.");
    const app = new AppPage(page);
    await page.goto("");

    await test.step("Submit the delete form", async () => {
      await app.userMenu().activate("deleteAccount");
      const form = app.deleteAccountPage().deleteAccountForm();
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

      // The SPA signs itself out locally, so assert against the server too:
      // `delete_me` flushing the session is what this test is really about.
      const response = await apiFetch("/v1/auth/users/me/", {
        headers: authHeaders(sessionCookies),
      });
      expect(response.status).toBe(403);
    });
  });
});
