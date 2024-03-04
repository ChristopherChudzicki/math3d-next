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

// create - activate - signin - verify - signout - verify
// create - duplicate account - error
// reset - unactivated acount
// reset - activated account
// reset - bad token

test.setTimeout(60_000);

test("User sign up flow", async ({ page, context }) => {
  const inbox = getInbox();

  await test.step("Delete ephemeral accounts", async () => {
    const authToken = await getAuthToken("admin");
    invariant(authToken, "Expected an auth token");
    const config = getConfig(authToken);
    const api = new AuthApi(config);
    const { data: response } = await api.authUsersList({
      email: env.TEST_USER_3_EMAIL,
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
    const app = new AppPage(page);
    await app.signupPage().signup({
      email: env.TEST_USER_3_EMAIL,
      publicNickname: "Test user 3",
      password: env.TEST_USER_3_PASSWORD,
    });
    const successScreen = app.signupPage().successScreen();
    await expect(successScreen).toBeVisible();

    await expect(successScreen.getByRole("alert")).toContainText(
      `To finish creating your account, please use the link emailed to ${env.TEST_USER_3_EMAIL}`,
    );
  });

  const activationLink =
    await test.step("Retrieve activation link", async () => {
      const message = await inbox.waitForEmail({
        subject: "Activate your account",
        to: env.TEST_USER_3_EMAIL,
      });
      invariant(message.html, "Expected email to have HTML content");
      const messagePage = await context.newPage();
      await messagePage.setContent(message.html);
      const link = await messagePage.getByTestId("activation-link");
      const href = await link.getAttribute("href");
      invariant(href, "Expected link to have href");
      await messagePage.goto(href); // Gives us a longer
      messagePage.close();
      return href;
    });

  await test.step("Activate account", async () => {
    await page.goto(activationLink);
    const dialog = await page.getByRole("dialog", {
      name: "Account Activation",
    });
    await expect(await dialog.getByRole("alert")).toContainText(
      /Account successfully activated./,
    );
    return dialog.getByRole("link", { name: "log in" }).click();
  });

  await test.step("Sign in & verify", async () => {
    const app = new AppPage(page);
    await app.signinPage().signin({
      email: env.TEST_USER_3_EMAIL,
      password: env.TEST_USER_3_PASSWORD,
    });
    await app.userMenu().opener().click();
    await expect(app.userMenu().username()).toHaveText(env.TEST_USER_3_EMAIL);
  });
});

test("Existing accounts cause error on signup", async ({ page }) => {
  await page.goto("/");
  const app = new AppPage(page);
  await app.signupPage().signup({
    email: env.TEST_USER_1_EMAIL,
    publicNickname: faker.name.firstName(),
    password: faker.internet.password(),
  });
  await expect(app.signupPage().email()).toBeInvalid();
  await expect(app.signupPage().email()).toHaveDescription(
    "User with this email address already exists.",
  );
});
