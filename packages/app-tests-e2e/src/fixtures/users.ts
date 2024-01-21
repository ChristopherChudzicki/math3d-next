import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { AuthApi, API_TOKEN_KEY, ScenesApi, Configuration } from "@math3d/api";
import type { Scene } from "@math3d/api";
import invariant from "tiny-invariant";
import env from "../env";

const TEST_SCENE_PREFIX = "[TEST-E2E-SCENE]";

const getConfig = (authToken: string | null) =>
  new Configuration({
    apiKey: () => {
      return authToken ? `Token ${authToken}` : "";
    },
  });
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

type Fixtures = {
  user: "static" | "dynamic" | null;
  authToken: string | null;
  page: Page;
  prepareScene: (scene: Scene) => Promise<string>;
};

const test = base.extend<Fixtures>({
  user: null,
  authToken: async ({ user: userString }, use) => {
    let authToken: string | null = null;
    if (userString) {
      const user = users[userString];
      const response = await authApi.authTokenLoginCreate({
        TokenCreateRequest: {
          email: user.email,
          password: user.password,
        },
      });
      // @ts-expect-error drf-spectacular issue
      authToken = response.data.auth_token;
    }
    await use(authToken);
  },
  page: async ({ page: basePage, browser, authToken }, use) => {
    let page: Page;
    if (authToken) {
      const context = await browser.newContext({
        storageState: {
          cookies: [],
          origins: [
            {
              origin: env.TEST_APP_URL,
              localStorage: [
                {
                  name: API_TOKEN_KEY,
                  value: `"${authToken}"`,
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
  prepareScene: async ({ user, authToken }, use) => {
    const scenesApi = new ScenesApi(getConfig(authToken), env.TEST_API_URL);
    let key: string | undefined;
    const create = async (s: Scene) => {
      const title =
        user === "dynamic" ? s.title : `${TEST_SCENE_PREFIX} ${s.title}`;
      const response = await scenesApi.scenesCreate({
        SceneRequest: { ...s, title },
      });
      key = response.data.key;
      invariant(key);
      return key;
    };
    await use(create);
    invariant(key);
    await scenesApi.scenesDestroy({ key });
  },
});

export { test };
