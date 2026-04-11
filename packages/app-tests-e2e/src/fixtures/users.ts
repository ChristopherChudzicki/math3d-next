import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { ScenesApi, Configuration, isAxiosError } from "@math3d/api";
import type { Scene } from "@math3d/api";
import env from "@/env";
import { createActiveUser, getSessionCookies, users } from "@/utils/api/auth";
import type { UserCredentials, UserInfo } from "@/utils/api/auth";
import { makeUserInfo } from "@math3d/mock-api";
import invariant from "tiny-invariant";

const TEST_SCENE_PREFIX = "[TEST-E2E-SCENE]";

type PrepareSceneOpts = {
  allowCleanup404: boolean;
};
type PrepareScene = (
  scene: Scene,
  opts?: Partial<PrepareSceneOpts>,
) => Promise<string>;

type SessionCookies = { sessionid: string; csrftoken: string };

type WorkerUser = {
  credentials: UserCredentials;
  info: Required<UserInfo>;
};

type WorkerFixtures = {
  workerUser: WorkerUser;
};

type Fixtures = {
  user: UserCredentials | "static" | "worker" | null;
  /**
   * Info for the current test's user. Available when user is "worker" or
   * a UserCredentials object passed through createUser.
   */
  userInfo: Required<UserInfo> | null;
  /**
   * When true, disables 3D MathBox rendering in the app. Defaults to true
   * since most E2E tests only interact with the controls sidebar.
   * Set to false for tests that need the 3D canvas (e.g., camera tests).
   */
  disable3d: boolean;
  /**
   * Create an active user.
   */
  createUser: (user: UserCredentials) => Promise<UserCredentials>;
  sessionCookies: SessionCookies | null;
  page: Page;
  getPrepareScene: ({
    sessionCookies,
  }: {
    sessionCookies: SessionCookies | null;
  }) => PrepareScene;
  prepareScene: PrepareScene;
};

const test = base.extend<Fixtures, WorkerFixtures>({
  // Worker-scoped: one user per Playwright worker, shared across tests.
  workerUser: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const { auth, info, cleanup } = await createActiveUser(makeUserInfo());
      await use({ credentials: auth, info });
      await cleanup();
    },
    { scope: "worker" },
  ],

  user: null,
  userInfo: null,
  disable3d: true,
  // eslint-disable-next-line no-empty-pattern
  createUser: async ({}, use) => {
    const requests: Promise<{
      cleanup: () => Promise<void>;
    }>[] = [];
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
   * Session cookies for `user` fixture.
   */
  sessionCookies: async ({ user, workerUser, createUser }, use) => {
    let cookies: SessionCookies | null = null;
    if (user) {
      let creds: UserCredentials;
      if (user === "static") {
        creds = users.static;
      } else if (user === "worker") {
        creds = workerUser.credentials;
      } else {
        creds = await createUser(user);
      }
      cookies = await getSessionCookies(creds);
    }
    await use(cookies);
  },
  /**
   * authenticated page for `user` fixture.
   */
  page: async ({ page: basePage, browser, sessionCookies, disable3d }, use) => {
    let page: Page;
    if (sessionCookies) {
      const apiUrl = new URL(env.TEST_API_URL);
      const appUrl = new URL(env.TEST_APP_URL);
      const context = await browser.newContext({
        storageState: {
          cookies: [
            {
              name: "sessionid",
              value: sessionCookies.sessionid,
              domain: apiUrl.hostname,
              path: "/",
              httpOnly: true,
              secure: false,
              sameSite: "Lax",
              expires: -1,
            },
            {
              name: "csrftoken",
              value: sessionCookies.csrftoken,
              domain: `.${appUrl.hostname}`,
              path: "/",
              httpOnly: false,
              secure: false,
              sameSite: "Lax",
              expires: -1,
            },
          ],
          origins: [],
        },
      });
      page = await context.newPage();
    } else {
      page = basePage;
    }
    if (disable3d) {
      await page.addInitScript(() => {
        localStorage.setItem("disable3dScene", "true");
      });
    }
    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern
  getPrepareScene: async ({}, user) => {
    const cleanups: (() => Promise<void>)[] = [];
    const getPrepareScene: Fixtures["getPrepareScene"] = ({
      sessionCookies: cookies,
    }) => {
      const config = new Configuration({
        basePath: env.TEST_API_URL,
        baseOptions: cookies
          ? {
              headers: {
                Cookie: `sessionid=${cookies.sessionid}; csrftoken=${cookies.csrftoken}`,
                "X-CSRFToken": cookies.csrftoken,
              },
              withCredentials: true,
            }
          : { withCredentials: true },
      });
      const scenesApi = new ScenesApi(config);
      const create: Fixtures["prepareScene"] = async (s, opts) => {
        const { allowCleanup404 = false } = opts ?? {};
        const title = cookies ? s.title : `${TEST_SCENE_PREFIX} ${s.title}`;
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
  prepareScene: async ({ user, sessionCookies, getPrepareScene }, use) => {
    invariant(
      user !== "static",
      "Static user should not create data during the e2e tests.",
    );
    const prepareScene = getPrepareScene({ sessionCookies });
    await use(prepareScene);
  },
});

export { test, users };
export type { Fixtures, WorkerUser };
