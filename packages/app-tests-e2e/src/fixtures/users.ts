import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { AuthApi, API_TOKEN_KEY } from "@math3d/api";
import env from "../env";

const authApi = new AuthApi(undefined, env.TEST_API_URL);

const users = {
  static: {
    email: env.TEST_USER_1_EMAIL,
    password: env.TEST_USER_1_PASSWORD,
  },
  dynamic: {
    email: env.TEST_USER_2_EMAIL,
    password: env.TEST_USER_2_PASSWORD,
  },
};

const test = base.extend<{ page: Page; user: "static" | "dynamic" | null }>({
  user: null,
  page: async ({ page: basePage, browser, user: userString }, use) => {
    let page: Page;
    if (userString) {
      const user = users[userString];
      const response = await authApi.authTokenLoginCreate({
        TokenCreateRequest: {
          email: user.email,
          password: user.password,
        },
      });
      const context = await browser.newContext({
        storageState: {
          cookies: [],
          origins: [
            {
              origin: env.TEST_APP_URL,
              localStorage: [
                {
                  name: API_TOKEN_KEY,
                  // @ts-expect-error drf-spectacular issue
                  value: `"${response.data.auth_token}"`,
                },
              ],
            },
          ],
        },
      });
      page = await context.newPage();
    } else {
      page = basePage;
    }
    await use(page);
  },
});

export { test };
