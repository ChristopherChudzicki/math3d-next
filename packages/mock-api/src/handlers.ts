import { http, HttpResponse } from "msw";
import type {
  PaginatedMiniSceneList,
  Scene,
  TokenCreate,
  TokenCreateRequest,
  UserCreatePasswordRetypeRequest,
  User,
  ActivationRequest,
} from "@math3d/api";
import db from "./db";

type ErrorResponseBody = Record<string, string | string[]>;

const getUser = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }
  const prefix = "Token ";
  const token = authHeader.slice(prefix.length);
  const user = db.user.findFirst({
    where: { auth_token: { equals: token } },
  });
  return user;
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
    users: `${BASE_URL}/v0/auth/users/`,
    usersMe: `${BASE_URL}/v0/auth/users/me/`,
    tokenLogin: `${BASE_URL}/v0/auth/token/login/`,
    tokenLogout: `${BASE_URL}/v0/auth/token/logout/`,
    activation: `${BASE_URL}/v0/auth/users/activation/`,
    resetPassword: `${BASE_URL}/v0/auth/users/reset_password/`,
    resetPasswordConfirm: `${BASE_URL}/v0/auth/users/reset_password_confirm/`,
  },
} as const;

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
  http.post<NoParams, TokenCreateRequest, ErrorResponseBody | TokenCreate>(
    urls.auth.tokenLogin,
    async ({ request }) => {
      const { email, password } = await request.json();
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
            non_field_errors: ["Unable to log in with provided credentials."],
          },
          { status: 400 },
        );
      }
      return HttpResponse.json({
        auth_token: "fake-token",
      });
    },
  ),
  http.post(urls.auth.tokenLogout, async ({ request }) => {
    const user = getUser(request);
    if (!user) {
      return HttpResponse.json(
        {
          errorMessage: "Invalid token",
        },
        { status: 401 },
      );
    }
    // The real API deletes the token, but that's not important for our tests.
    return new HttpResponse(null, { status: 204 });
  }),
  http.post<
    NoParams,
    UserCreatePasswordRetypeRequest,
    ErrorResponseBody | User
  >(urls.auth.users, async ({ request }) => {
    const { email, password } = await request.json();
    if (typeof email !== "string") {
      throw new Error("email should be string");
    }
    if (typeof password !== "string" /** # pragma: allowlist secret */) {
      throw new Error("password should be string");
    }
    const user = db.user.create({
      email,
      password,
    });
    return HttpResponse.json(
      {
        public_nickname: user.public_nickname,
        email: user.email,
      },
      { status: 201 },
    );
  }),
  http.post<
    NoParams,
    UserCreatePasswordRetypeRequest,
    ErrorResponseBody | User
  >(urls.auth.users, async ({ request }) => {
    const { email, password } = await request.json();
    if (typeof email !== "string") {
      throw new Error("email should be string");
    }
    if (typeof password !== "string" /** # pragma: allowlist secret */) {
      throw new Error("password should be string");
    }
    const user = db.user.create({
      email,
      password,
    });
    return HttpResponse.json(
      {
        public_nickname: user.public_nickname,
        email: user.email,
      },
      { status: 201 },
    );
  }),
  http.get<NoParams, UserCreatePasswordRetypeRequest, ErrorResponseBody | User>(
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
      return HttpResponse.json(user, { status: 201 });
    },
  ),
  http.post<NoParams, ActivationRequest>(
    urls.auth.activation,
    async ({ request }) => {
      const { uid, token } = await request.json();
      if (typeof uid !== "string") {
        throw new Error("uid should be string");
      }
      if (typeof token !== "string") {
        throw new Error("token should be string");
      }
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.post(urls.auth.resetPassword, async () => {
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(urls.auth.resetPasswordConfirm, async () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
