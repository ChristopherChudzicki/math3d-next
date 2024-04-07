import { test } from "@/fixtures/users";
import { expect } from "@/utils/expect";
import AppPage from "@/utils/pages/AppPage";
import { getInbox } from "@/utils/inbox/emails";
import env from "@/env";
import invariant from "tiny-invariant";
import { faker } from "@faker-js/faker/locale/en";
import { getAuthToken } from "@/utils/api/auth";
import { getConfig, axios } from "@/utils/api/config";
import { AuthApi, deleteUser } from "@math3d/api";

test.setTimeout(60_000);

test("User sign up flow and account deletion", async ({ page, context }) => {
  const inbox = getInbox();
  const app = new AppPage(page);

  await test.step("Delete ephemeral accounts", async () => {
    const authToken = await getAuthToken("admin");
    invariant(authToken, "Expected an auth token");
    const config = getConfig(authToken);
    const api = new AuthApi(config);
    const { data: response } = await api.authUsersList({
      email: env.TEST_USER_NOT_CREATED_EMAIL,
    });
    const { results: users } = response;
    invariant(users, "Expected users to be defined");
    invariant(users.length <= 1, "Expected at most one user with this email");
    if (users.length === 1) {
      await deleteUser(
        { id: users[0].id, currentPassword: env.TEST_USER_ADMIN_PASSWORD },
        config,
        axios,
      );
    }
  });

  await test.step("Create account", async () => {
    await page.goto("/");
    await app.signupPage().signup({
      email: env.TEST_USER_NOT_CREATED_EMAIL,
      publicNickname: "Test user 3",
      password: env.TEST_USER_NOT_CREATED_PASSWORD,
    });
    const successScreen = app.signupPage().successScreen();
    await expect(successScreen).toBeVisible();

    await expect(successScreen.getByRole("alert")).toContainText(
      `To finish creating your account, please use the link emailed to ${env.TEST_USER_NOT_CREATED_EMAIL}`,
    );
  });

  const activationLink =
    await test.step("Retrieve activation link", async () => {
      const message = await inbox.waitForEmail({
        subject: "Activate your account",
        to: env.TEST_USER_NOT_CREATED_EMAIL,
      });
      invariant(message.html, "Expected email to have HTML content");
      const messagePage = await context.newPage();
      await messagePage.setContent(message.html);
      const link = await messagePage.getByTestId("activation-link");
      const href = await link.getAttribute("href");
      invariant(href, "Expected link to have href");
      messagePage.close();
      return href;
    });

  await test.step("Activate account", async () => {
    await page.goto(activationLink);
    const dialog = await page.getByRole("dialog", {
      name: "Account Activation",
    });
    await expect(
      dialog.getByRole("alert"),
      "This can be flaky in dev mode due to StrictMode double renders => 2 API calls",
    ).toContainText(/Account successfully activated./);
    return dialog.getByRole("link", { name: "log in" }).click();
  });

  await test.step("Sign in & verify", async () => {
    await app.signinPage().signin({
      email: env.TEST_USER_NOT_CREATED_EMAIL,
      password: env.TEST_USER_NOT_CREATED_PASSWORD,
    });
    await app.userMenu().opener().click();
    await expect(app.userMenu().username()).toHaveText(
      env.TEST_USER_NOT_CREATED_EMAIL,
    );
  });

  await test.step("Delete account", async () => {
    await app.userMenu().activate("settings");
    const deleteAccountForm = app.userSettings().deleteAccountForm();
    await deleteAccountForm.activate();
    await deleteAccountForm.password().fill(env.TEST_USER_NOT_CREATED_PASSWORD);
    await deleteAccountForm.confirm().fill("Yes, permanently delete");
    await deleteAccountForm.submit().click();
  });

  await test.step("Verify account deletion", async () => {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toContainText("Account Deleted");
    await dialog.getByRole("button", { name: "OK" }).click();

    await app.assertSignedOut();

    await app.signinPage().signin({
      email: env.TEST_USER_NOT_CREATED_EMAIL,
      password: env.TEST_USER_NOT_CREATED_PASSWORD,
    });

    await expect(dialog.getByRole("alert")).toContainText(/Unable to log in/);
  });
});

test("Existing accounts cause error on signup", async ({ page }) => {
  await page.goto("/");
  const app = new AppPage(page);
  await app.signupPage().signup({
    email: env.TEST_USER_STATIC_EMAIL,
    publicNickname: faker.person.firstName(),
    password: faker.internet.password(),
  });
  await expect(app.signupPage().email()).toBeInvalid();
  await expect(app.signupPage().email()).toHaveDescription(
    "User with this email address already exists.",
  );
});
