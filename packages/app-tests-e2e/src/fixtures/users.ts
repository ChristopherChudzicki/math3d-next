import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { API_TOKEN_KEY, ScenesApi, isAxiosError } from "@math3d/api";
import type { Scene } from "@math3d/api";
import env from "@/env";
import { getConfig } from "@/utils/api/config";
import { createActiveUser, getAuthToken, users } from "@/utils/api/auth";
import type { UserCredentials, UserInfo } from "@/utils/api/auth";
import invariant from "tiny-invariant";

const TEST_SCENE_PREFIX = "[TEST-E2E-SCENE]";

type PrepareSceneOpts = {
  allowCleanup404: boolean;
};

type UserFixture = keyof typeof users | UserInfo;
type Fixtures = {
  user: UserFixture | null;
  /**
   * Create an activte user.
   */
  createUser: (user: UserFixture) => Promise<UserCredentials>;
  authToken: string | null;
  page: Page;
  prepareScene: (
    scene: Scene,
    opts?: Partial<PrepareSceneOpts>,
  ) => Promise<string>;
};

const test = base.extend<Fixtures>({
  user: null,
  // eslint-disable-next-line no-empty-pattern
  createUser: async ({}, use) => {
    const requests: Promise<{ cleanup: () => Promise<void> }>[] = [];
    const createUser: Fixtures["createUser"] = async (user) => {
      if (typeof user === "string") {
        return users[user];
      }
      const request = createActiveUser(user);
      requests.push(request);
      const { auth } = await request;
      return auth;
    };
    await use(createUser);
    const cleanups = await Promise.all(requests);
    await Promise.all(cleanups.map((r) => r.cleanup()));
  },
  /**
   * Auth token for `user` fixture.
   */
  authToken: async ({ user, createUser }, use) => {
    let authToken: string | null = null;
    if (user) {
      const creds =
        typeof user === "string" ? users[user] : await createUser(user);
      authToken = await getAuthToken(creds);
    }
    await use(authToken);
  },
  /**
   * authenticated page for `user` fixture.
   */
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
  /**
   * pre-create scenes owned by `user` fixture.
   */
  prepareScene: async ({ user, authToken }, use) => {
    const scenesApi = new ScenesApi(getConfig(authToken));
    const cleanup: { key: string; allow404: boolean }[] = [];
    const create: Fixtures["prepareScene"] = async (s, opts) => {
      const { allowCleanup404 = false } = opts ?? {};
      invariant(
        user !== "static",
        "Do not create scenes with pre-seeded static user during e2e tests",
      );
      const title = user ? s.title : `${TEST_SCENE_PREFIX} ${s.title}`;
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
