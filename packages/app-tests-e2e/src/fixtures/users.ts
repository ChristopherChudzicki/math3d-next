import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { API_TOKEN_KEY, ScenesApi, isAxiosError } from "@math3d/api";
import type { Scene } from "@math3d/api";
import env from "@/env";
import { getConfig } from "@/utils/api/config";
import { createActiveUser, getAuthToken, users } from "@/utils/api/auth";
import type { UserFixture } from "@/utils/api/auth";

const TEST_SCENE_PREFIX = "[TEST-E2E-SCENE]";

type PrepareSceneOpts = {
  allowCleanup404: boolean;
};

type Fixtures = {
  user: keyof typeof users | null | UserFixture;
  authToken: string | null;
  page: Page;
  prepareScene: (
    scene: Scene,
    opts?: Partial<PrepareSceneOpts>,
  ) => Promise<string>;
};

const isEphemeralUser = (user: Fixtures["user"]): user is UserFixture => {
  if (typeof user === "string" || user === null) {
    return false;
  }
  return true;
};

const test = base.extend<Fixtures>({
  user: null,
  authToken: async ({ user }, use) => {
    let authToken: string | null = null;
    let cleanup = async () => {};
    if (isEphemeralUser(user)) {
      const ephemeralUser = await createActiveUser(user);
      authToken = await getAuthToken(ephemeralUser.auth);
      cleanup = ephemeralUser.cleanup;
    } else if (user) {
      authToken = await getAuthToken(user);
    }
    await use(authToken);
    await cleanup();
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
    const cleanup: { key: string; allow404: boolean }[] = [];
    const create: Fixtures["prepareScene"] = async (s, opts) => {
      const { allowCleanup404 = false } = opts ?? {};
      const title = isEphemeralUser(user)
        ? s.title
        : `${TEST_SCENE_PREFIX} ${s.title}`;
      const response = await scenesApi.scenesCreate({
        SceneCreateRequest: { ...s, title },
      });
      const { key } = response.data;
      cleanup.push({ key, allow404: allowCleanup404 });
      return key;
    };
    await use(create);
    const cleanupRequests = await Promise.allSettled(
      cleanup.map(({ key }) => scenesApi.scenesDestroy({ key })),
    );
    cleanupRequests.forEach((r, i) => {
      if (r.status === "rejected") {
        const { key, allow404 } = cleanup[i];
        if (isAxiosError(r.reason, [404])) {
          if (!allow404) {
            throw new Error(`Scene with key ${key} not found`);
          }
        } else {
          throw r.reason;
        }
      }
    });
  },
});

export { test };
export type { Fixtures };
