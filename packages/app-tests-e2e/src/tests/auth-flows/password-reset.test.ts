import { test } from "@/fixtures/users";
import { expect } from "@/utils/expect";
import AppPage from "@/utils/pages/AppPage";
import { getInbox } from "@/utils/inbox/emails";
import { createActiveUser, deleteUser } from "@/utils/api/auth";
import { makeUserInfo } from "@math3d/mock-api";
import { faker } from "@faker-js/faker/locale/en";
import invariant from "tiny-invariant";

test.setTimeout(60_000);

test.describe("Password reset flow", () => {
  test("Reset password via emailed link, then log in", async ({
    page,
    context,
  }) => {
    const inbox = getInbox();
    const app = new AppPage(page);
    const { auth, cleanup } = await createActiveUser(makeUserInfo());
    const newPassword = faker.internet.password();

    try {
      await test.step("Request password reset", async () => {
        await page.goto("/auth/reset-password");
        const dialog = page.getByRole("dialog", { name: "Reset Password" });
        await dialog.getByLabel("Email").fill(auth.email);
        await dialog.getByRole("button", { name: "Reset Password" }).click();
        await expect(page.getByRole("alert")).toContainText(
          /please use the link emailed to/,
        );
      });

      const resetLink = await test.step("Retrieve reset link", async () => {
        const message = await inbox.waitForEmail({
          subject: /Password reset/,
          to: auth.email,
        });
        invariant(message.html, "Expected email to have HTML content");
        const messagePage = await context.newPage();
        await messagePage.setContent(message.html);
        const href = await messagePage
          .getByTestId("password-reset-link")
          .getAttribute("href");
        invariant(href, "Expected reset link to have href");
        await messagePage.close();
        return href;
      });

      await test.step("Set a new password", async () => {
        await page.goto(resetLink);
        const dialog = page.getByRole("dialog", { name: "Change Password" });
        await dialog
          .getByLabel("New Password", { exact: true })
          .fill(newPassword);
        await dialog.getByLabel("Confirm New Password").fill(newPassword);
        await dialog.getByRole("button", { name: "Change Password" }).click();
        await expect(dialog.getByRole("alert")).toContainText(
          /Password changed/,
        );
      });

      await test.step("Log in with the new password", async () => {
        await page.goto("/");
        await app
          .signinPage()
          .signin({ email: auth.email, password: newPassword });
        await app.userMenu().opener().click();
        await expect(app.userMenu().username()).toHaveText(auth.email);
      });
    } finally {
      // The reset changes the password, so delete with whichever credential is
      // valid: the new password if the reset succeeded, the original (via
      // cleanup) otherwise. Both no-op if the account is already gone.
      await deleteUser({ email: auth.email, password: newPassword });
      await cleanup();
    }
  });
});
