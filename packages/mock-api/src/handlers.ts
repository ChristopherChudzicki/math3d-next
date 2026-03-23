import { http, HttpResponse } from "msw";
import type { PaginatedMiniSceneList, Scene, User } from "@math3d/api";
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
  getCurrentUser: () => {
    if (currentUserId === null) return null;
    return db.user.findFirst({
      where: { id: { equals: currentUserId } },
    });
  },
};

const getUser = (_req: Request) => {
  // Session-based auth: check module-level current user
  if (currentUserId !== null) {
    const user = db.user.findFirst({
      where: { id: { equals: currentUserId } },
    });
    if (user) return user;
  }
  // Fallback: check Authorization header for backward compat with e2e tests
  const authHeader = _req.headers.get("Authorization");
  if (authHeader) {
    const prefix = "Token ";
    const token = authHeader.slice(prefix.length);
    const user = db.user.findFirst({
      where: { auth_token: { equals: token } },
    });
    return user;
  }
  return false;
};

const BASE_URL: string = import.meta.env?.VITE_API_BASE_URL ?? "";

type NoParams = Record<string, never>;
export const urls = {
  scenes: {
    detail: `${BASE_URL}/v0/scenes/:key/`,
    list: `${BASE_URL}/v0/scenes/`,
    meList: `${BASE_URL}/v0/scenes/me/`,
  },
  auth: {
    usersMe: `${BASE_URL}/v0/auth/users/me/`,
    // allauth headless endpoints
    login: `${BASE_URL}/_allauth/browser/v1/auth/login`,
    logout: `${BASE_URL}/_allauth/browser/v1/auth/session`,
    session: `${BASE_URL}/_allauth/browser/v1/auth/session`,
    signup: `${BASE_URL}/_allauth/browser/v1/auth/signup`,
    verifyEmail: `${BASE_URL}/_allauth/browser/v1/auth/email/verify`,
    requestPasswordReset: `${BASE_URL}/_allauth/browser/v1/auth/password/request`,
    resetPassword: `${BASE_URL}/_allauth/browser/v1/auth/password/reset`,
    changePassword: `${BASE_URL}/_allauth/browser/v1/account/password/change`,
  },
} as const;

const makeAuthenticatedResponse = (user: {
  id: number;
  email: string;
  public_nickname: string;
}) => ({
  status: 200,
  data: {
    user: {
      id: user.id,
      display: user.public_nickname,
      email: user.email,
      has_usable_password: true,
    },
    methods: [
      {
        method: "password",
        at: Date.now() / 1000,
        email: user.email,
      },
    ],
  },
  meta: {
    is_authenticated: true,
  },
});

export const handlers = [
  http.get<NoParams, ErrorResponseBody | PaginatedMiniSceneList>(
    urls.scenes.meList,
    async ({ request }) => {
      const user = getUser(request);
      if (!user) {
        return HttpResponse.json(
          {
            errorMessage: "Invalid token",
          },
          { status: 401 },
        );
      }

      const scenes = db.scene.findMany({
        where: {
          author: {
            equals: user.id,
          },
        },
      });
      const mini = scenes.map((s) => ({
        title: s.title,
        key: s.key,
      }));
      return HttpResponse.json({
        count: mini.length,
        next: null,
        previous: null,
        results: mini,
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
        return HttpResponse.json(
          {
            errorMessage: "Not found",
          },
          { status: 404 },
        );
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
  // allauth login
  http.post(urls.auth.login, async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };
    if (typeof email !== "string") {
      throw new Error("email should be string");
    }
    if (typeof password !== "string" /** # pragma: allowlist secret */) {
      throw new Error("password should be string");
    }
    const user = db.user.findFirst({
      where: { email: { equals: email } },
    });
    if (!user || user.password !== password) {
      return HttpResponse.json(
        {
          status: 400,
          errors: [
            {
              code: "email_password_mismatch",
              message:
                "The email address and/or password you specified are not correct.",
              param: "password",
            },
          ],
        },
        { status: 400 },
      );
    }
    currentUserId = user.id;
    return HttpResponse.json(makeAuthenticatedResponse(user));
  }),
  // allauth session (GET = check session, DELETE = logout)
  http.get(urls.auth.session, async () => {
    const user = mockAuth.getCurrentUser();
    if (!user) {
      return HttpResponse.json(
        {
          status: 401,
          data: {
            flows: [{ id: "login" }, { id: "signup" }],
          },
          meta: {
            is_authenticated: false,
          },
        },
        { status: 401 },
      );
    }
    return HttpResponse.json(makeAuthenticatedResponse(user));
  }),
  http.delete(urls.auth.logout, async () => {
    currentUserId = null;
    return HttpResponse.json(
      {
        status: 401,
        data: {
          flows: [{ id: "login" }, { id: "signup" }],
        },
        meta: {
          is_authenticated: false,
        },
      },
      { status: 401 },
    );
  }),
  // allauth signup
  http.post(urls.auth.signup, async ({ request }) => {
    const { email, password, public_nickname } = (await request.json()) as {
      email: string;
      password: string;
      public_nickname?: string;
    };
    if (typeof email !== "string") {
      throw new Error("email should be string");
    }
    if (typeof password !== "string" /** # pragma: allowlist secret */) {
      throw new Error("password should be string");
    }
    db.user.create({
      email,
      password,
      public_nickname: public_nickname ?? "",
    });
    // allauth returns 401 when email verification is required
    return HttpResponse.json(
      {
        status: 401,
        data: {
          flows: [{ id: "verify_email" }],
        },
        meta: {
          is_authenticated: false,
        },
      },
      { status: 401 },
    );
  }),
  // allauth verify email
  http.post(urls.auth.verifyEmail, async ({ request }) => {
    const { key } = (await request.json()) as { key: string };
    if (typeof key !== "string") {
      throw new Error("key should be string");
    }
    // In mock, just return success with a fake authenticated user
    const user = db.user.getAll()[0];
    if (user) {
      currentUserId = user.id;
      return HttpResponse.json(makeAuthenticatedResponse(user));
    }
    return new HttpResponse(null, { status: 200 });
  }),
  // allauth request password reset
  http.post(urls.auth.requestPasswordReset, async () => {
    return HttpResponse.json({ status: 200 });
  }),
  // allauth reset password with key
  http.post(urls.auth.resetPassword, async () => {
    return HttpResponse.json({ status: 200 });
  }),
  // allauth change password
  http.post(urls.auth.changePassword, async () => {
    return HttpResponse.json({ status: 200 });
  }),
  // DRF custom: users/me GET
  http.get<NoParams, ErrorResponseBody | User>(
    urls.auth.usersMe,
    async ({ request }) => {
      const user = getUser(request);
      if (!user) {
        return HttpResponse.json(
          {
            errorMessage: "Invalid token",
          },
          { status: 401 },
        );
      }
      return HttpResponse.json(
        {
          id: user.id,
          email: user.email,
          public_nickname: user.public_nickname,
        },
        { status: 200 },
      );
    },
  ),
];
