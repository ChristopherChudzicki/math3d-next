import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { API_TOKEN_KEY, ScenesApi, isAxiosError } from "@math3d/api";
import type { Scene } from "@math3d/api";
import env from "@/env";
import { getConfig } from "@/utils/api/config";
import { createActiveUser, getAuthToken, users } from "@/utils/api/auth";
import type { UserCredentials } from "@/utils/api/auth";
import invariant from "tiny-invariant";

const TEST_SCENE_PREFIX = "[TEST-E2E-SCENE]";

type PrepareSceneOpts = {
  allowCleanup404: boolean;
};
type PrepareScene = (
  scene: Scene,
  opts?: Partial<PrepareSceneOpts>,
) => Promise<string>;

type Fixtures = {
  user: UserCredentials | "static" | null;
  /**
   * Create an activte user.
   */
  createUser: (user: UserCredentials) => Promise<UserCredentials>;
  authToken: string | null;
  page: Page;
  getPrepareScene: ({
    authToken,
  }: {
    authToken: string | null;
  }) => PrepareScene;
  prepareScene: PrepareScene;
};

const test = base.extend<Fixtures>({
  user: null,
  // eslint-disable-next-line no-empty-pattern
  createUser: async ({}, use) => {
    const requests: Promise<{ cleanup: () => Promise<void> }>[] = [];
    const createUser: Fixtures["createUser"] = async (user) => {
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
  // eslint-disable-next-line no-empty-pattern
  getPrepareScene: async ({}, user) => {
    const cleanups: (() => Promise<void>)[] = [];
    const getPrepareScene: Fixtures["getPrepareScene"] = ({ authToken }) => {
      const scenesApi = new ScenesApi(getConfig(authToken));
      const create: Fixtures["prepareScene"] = async (s, opts) => {
        const { allowCleanup404 = false } = opts ?? {};
        const title = authToken ? s.title : `${TEST_SCENE_PREFIX} ${s.title}`;
        const response = await scenesApi.scenesCreate({
          SceneCreateRequest: { ...s, title },
        });
        const { key } = response.data;
        const cleanup = async () => {
          try {
            await scenesApi.scenesDestroy({ key });
          } catch (err) {
            if (isAxiosError(err, [404])) {
              if (!allowCleanup404) {
                throw new Error(`Scene with key ${key} not found`);
              }
            } else {
              throw err;
            }
          }
        };
        cleanups.push(cleanup);
        return key;
      };
      return create;
    };
    user(getPrepareScene);
    await Promise.all(cleanups.map((f) => f()));
  },
  /**
   * pre-create scenes owned by `user` fixture.
   */
  prepareScene: async ({ user, authToken, getPrepareScene }, use) => {
    invariant(
      user !== "static",
      "Static user should not create data during the e2e tests.",
    );
    const prepareScene = getPrepareScene({ authToken });
    await use(prepareScene);
  },
});

export { test, users };
export type { Fixtures };
