import { test } from "@/fixtures/users";
import { expect } from "@/utils/expect";
import AppPage from "@/utils/pages/AppPage";
import env from "@/env";
import { faker } from "@faker-js/faker/locale/en";
import { getAuthToken } from "@/utils/api/auth";
import invariant from "tiny-invariant";
import { getConfig } from "@/utils/api/config";
import { AuthApi } from "@math3d/api";
import { isAxiosError } from "axios";

test.describe("Password changes", () => {
  const newPassword = faker.internet.password();

  test.use({ user: "pwChanger" });

  test.afterEach(async () => {
    /**
     * Reset the password. This might fail if the password change failed, but
     * in that case, the password is the original password anyway.
     */
    try {
      const authToken = await getAuthToken({
        email: env.TEST_USER_PW_CHANGER_EMAIL,
        password: newPassword,
      });
      invariant(authToken, "Expected an auth token");
      const config = getConfig(authToken);
      const api = new AuthApi(config);
      await api.authUsersSetPasswordCreate({
        SetPasswordRetypeRequest: {
          current_password: newPassword,
          new_password: env.TEST_USER_PW_CHANGER_PASSWORD,
          re_new_password: env.TEST_USER_PW_CHANGER_PASSWORD,
        },
      });
    } catch (err) {
      invariant(isAxiosError(err), "Expected an axios error");
      const { response } = err;
      invariant(response, "Expected a response");
      invariant(response.status === 400, "Expected a 400 error");
      expect(
        response.data,
        "If there's an error, it should be about the current password",
      ).toMatchObject({
        current_password: expect.anything(),
      });
    }
  });

  test("Changing password settings form", async ({ page }) => {
    const app = new AppPage(page);
    await page.goto("");

    await test.step("Submit change password form", async () => {
      await app.userMenu().activate("settings");
      const form = app.userSettings().changePasswordForm();
      await form.activate();
      await form.currentPassword().fill(env.TEST_USER_PW_CHANGER_PASSWORD);
      await form.newPassword().fill(newPassword);
      await form.confirmNewPassword().fill(newPassword);
      await form.submit().click();
      await app.userSettings().close().click();
    });

    await test.step("Login with new password", async () => {
      await app.signout();
      await app.assertSignedOut();
      await app.signin({
        email: env.TEST_USER_PW_CHANGER_EMAIL,
        password: newPassword,
      });
      await app.assertSignedIn();
    });
  });
});
