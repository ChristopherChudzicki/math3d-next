import { test } from "@/fixtures/users";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";
import { makeUserInfo } from "@math3d/mock-api";

test.describe("Password changes", () => {
  const user = makeUserInfo();
  const newPassword = faker.internet.password();
  test.use({ user });

  test("Changing password settings form", async ({ page }) => {
    const app = new AppPage(page);
    await page.goto("");

    await test.step("Submit change password form", async () => {
      await app.userMenu().activate("settings");
      const form = app.userSettings().changePasswordForm();
      await form.activate();
      await form.currentPassword().fill(user.password);
      await form.newPassword().fill(newPassword);
      await form.confirmNewPassword().fill(newPassword);
      await form.submit().click();
      await app.userSettings().close().click();
    });

    await test.step("Login with new password", async () => {
      await app.signout();
      await app.assertSignedOut();
      await app.signin({
        email: user.email,
        password: newPassword,
      });
      await app.assertSignedIn();
    });
  });
});
