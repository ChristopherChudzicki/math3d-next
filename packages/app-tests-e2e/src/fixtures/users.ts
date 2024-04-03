import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { API_TOKEN_KEY, ScenesApi } from "@math3d/api";
import type { Scene } from "@math3d/api";
import invariant from "tiny-invariant";
import env from "@/env";
import { getConfig } from "@/utils/api/config";
import { getAuthToken, users } from "@/utils/api/auth";

const TEST_SCENE_PREFIX = "[TEST-E2E-SCENE]";

type Fixtures = {
  user: keyof typeof users | null;
  authToken: string | null;
  page: Page;
  prepareScene: (scene: Scene) => Promise<string>;
};

const test = base.extend<Fixtures>({
  user: null,
  authToken: async ({ user }, use) => {
    let authToken: string | null = null;
    if (user) {
      authToken = await getAuthToken(user);
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
    const scenesApi = new ScenesApi(getConfig(authToken));
    let key: string | undefined;
    const create = async (s: Scene) => {
      const title =
        user === "dynamic" ? s.title : `${TEST_SCENE_PREFIX} ${s.title}`;
      const response = await scenesApi.scenesCreate({
        SceneCreateRequest: { ...s, title },
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
