import { http, HttpResponse } from "msw";
import type { PagedMiniSceneSchema, Scene, User } from "@math3d/api";
import db from "./db";

type ErrorResponseBody = Record<string, string | string[]>;

/**
 * In the mock API, we simulate session auth by tracking the "logged in" user
 * via a module-level variable. The real app uses cookies, but MSW intercepts
 * don't have real cookie support, so this is the simplest approach for tests.
 */
let currentUserId: number | null = null;

export const mockAuth = {
  setCurrentUser: (userId: number | null) => {
    currentUserId = userId;
  },
};

const getUser = () => {
  // Session-based auth: check module-level current user
  if (currentUserId !== null) {
    const user = db.user.findFirst({
      where: { id: { equals: currentUserId } },
    });
    if (user) return user;
  }
  return false;
};

const BASE_URL: string = import.meta.env?.VITE_API_BASE_URL ?? "";

type NoParams = Record<string, never>;
export const urls = {
  scenes: {
    detail: `${BASE_URL}/v1/scenes/:key/`,
    list: `${BASE_URL}/v1/scenes/`,
    meList: `${BASE_URL}/v1/scenes/me/`,
  },
  auth: {
    usersMe: `${BASE_URL}/v1/auth/users/me/`,
    usersMeDelete: `${BASE_URL}/v1/auth/users/me/delete/`,
    // allauth headless endpoints
    session: `${BASE_URL}/_allauth/browser/v1/auth/session`,
    providerToken: `${BASE_URL}/_allauth/browser/v1/auth/provider/token`,
  },
} as const;

// Matches `allauth.headless.socialaccount.response.provider_flows` for a
// browser client with only Google configured: Google supports both redirect
// and token authentication, so it appears in both flow entries.
const ANONYMOUS_FLOWS = [
  { id: "provider_redirect", providers: ["google"] },
  { id: "provider_token", providers: ["google"] },
];

// Matches allauth's socialaccount authentication record (see
// `allauth.account.internal.flows.login.record_authentication`'s docstring
// example), the only method this SOCIALACCOUNT_ONLY deployment produces.
const makeAuthenticatedResponse = (user: { id: number; email: string }) => ({
  status: 200,
  data: {
    user: {
      id: user.id,
      display: user.email,
      email: user.email,
      has_usable_password: false,
    },
    methods: [
      {
        method: "socialaccount",
        at: Date.now() / 1000,
        provider: "google",
        uid: String(user.id),
      },
    ],
  },
  meta: {
    is_authenticated: true,
  },
});

export const handlers = [
  // v1: my scenes. The anonymous response is a 403, not Ninja's default 401:
  // main/api.py remaps AuthenticationError because session auth cannot send a
  // compliant WWW-Authenticate challenge.
  http.get<NoParams, ErrorResponseBody | PagedMiniSceneSchema>(
    urls.scenes.meList,
    async () => {
      const user = getUser();
      if (!user) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }

      const scenes = db.scene.findMany({
        where: {
          author: {
            equals: user.id,
          },
        },
      });
      const items = scenes.map((s) => ({
        title: s.title,
        key: s.key,
        author: s.author,
        archived: s.archived,
        createdDate: s.createdDate,
        modifiedDate: s.modifiedDate,
      }));
      return HttpResponse.json({
        count: items.length,
        items,
      });
    },
  ),
  http.get<{ key: string }, null, ErrorResponseBody | Scene>(
    urls.scenes.detail,
    ({ params }) => {
      const { key } = params;
      if (typeof key !== "string") {
        throw new Error("key should be string");
      }
      const scene = db.scene.findFirst({
        where: { key: { equals: key } },
      });
      if (!scene) {
        // Ninja's default Http404 body.
        return HttpResponse.json({ detail: "Not Found" }, { status: 404 });
      }
      const parsedScene = {
        ...scene,
        itemOrder: JSON.parse(scene.itemOrder),
      };
      return HttpResponse.json(parsedScene);
    },
  ),
  http.post<NoParams, Scene, ErrorResponseBody | Scene>(
    urls.scenes.list,
    async ({ request }) => {
      const { title, items, itemOrder } = await request.json();
      if (typeof title !== "string") {
        throw new Error("title should be string");
      }
      if (!Array.isArray(items)) {
        throw new Error("items should be array");
      }
      if (!itemOrder) {
        throw new Error("itemOrder should be object");
      }
      const sceneRecord = db.scene.create({
        title,
        items,
        itemOrder: JSON.stringify(itemOrder),
      });
      const scene: Scene = {
        ...sceneRecord,
        itemOrder: JSON.parse(sceneRecord.itemOrder),
      };
      return HttpResponse.json(scene, { status: 201 });
    },
  ),
  http.post(urls.auth.providerToken, async ({ request }) => {
    const invalidToken = () =>
      HttpResponse.json(
        {
          status: 400,
          errors: [
            {
              code: "token_required",
              message: "Invalid token.",
              param: "token",
            },
          ],
        },
        { status: 400 },
      );
    const { process, token } = (await request.json()) as {
      process?: string;
      token?: { id_token?: string; client_id?: string };
    };
    if (typeof token?.id_token !== "string") {
      return invalidToken();
    }
    // Real allauth rejects a token whose client_id doesn't match the
    // provider's configured app. `process` is pinned here as a tripwire, not
    // a copy of allauth, which also accepts "connect": the SPA only ever signs
    // in, so a request carrying anything else is a bug.
    const configuredClientId: string =
      import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? "";
    if (token.client_id !== configuredClientId || process !== "login") {
      return HttpResponse.json(
        {
          status: 400,
          errors: [
            {
              code: "client_id_mismatch",
              message: "The token's client_id does not match this app.",
              param: "token",
            },
          ],
        },
        { status: 400 },
      );
    }
    // The id_token is read as JSON claims, matching the dummy provider the e2e
    // suite signs in through. A real Google credential is a signed JWT that
    // only the backend can verify, which no mock can stand in for.
    let claims: { email: string };
    try {
      claims = JSON.parse(token.id_token) as { email: string };
    } catch {
      return invalidToken();
    }
    const { email } = claims;
    const user =
      db.user.findFirst({ where: { email: { equals: email } } }) ??
      db.user.create({ email });
    currentUserId = user.id;
    return HttpResponse.json(makeAuthenticatedResponse(user));
  }),
  // allauth sign-out
  http.delete(urls.auth.session, async () => {
    currentUserId = null;
    return HttpResponse.json(
      {
        status: 401,
        data: {
          flows: ANONYMOUS_FLOWS,
        },
        meta: {
          is_authenticated: false,
        },
      },
      { status: 401 },
    );
  }),
  // v1: delete own account (204 No Content; signs the user out)
  http.post(urls.auth.usersMeDelete, async () => {
    currentUserId = null;
    return new HttpResponse(null, { status: 204 });
  }),
  // v1: users/me GET. `get_me` gates by hand (`auth=None`, `403: None`) so the
  // CSRF cookie is seeded before the gate — which also means the anonymous 403
  // never reaches main/api.py's AuthenticationError handler and so carries no
  // body. Content-Length is spelled out to match Django's CommonMiddleware:
  // openapi-fetch keys on it to yield `error: undefined` (without it, `""`),
  // the shape useUserMe must survive.
  http.get<NoParams, ErrorResponseBody | User>(urls.auth.usersMe, async () => {
    const user = getUser();
    if (!user) {
      return new HttpResponse(null, {
        status: 403,
        headers: {
          "content-length": "0",
          "content-type": "application/json",
        },
      });
    }
    return HttpResponse.json(
      {
        id: user.id,
        email: user.email,
      },
      { status: 200 },
    );
  }),
];
