import { rest } from "msw";
import type { RestRequest } from "msw";
import db from "./db";

const hasValidToken = (req: RestRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }
  const prefix = "Token ";
  const token = authHeader.slice(prefix.length);
  const user = db.user.findFirst({
    where: { auth_token: { equals: token } },
  });
  return !!user;
};

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

export const urls = {
  scenes: {
    detail: `${BASE_URL}/v0/scenes/:key/`,
    list: `${BASE_URL}/v0/scenes/`,
  },
  auth: {
    users: `${BASE_URL}/v0/auth/users/`,
    tokenLogin: `${BASE_URL}/v0/auth/token/login/`,
    tokenLogout: `${BASE_URL}/v0/auth/token/logout/`,
    activation: `${BASE_URL}/v0/auth/users/activation/`,
    resetPassword: `${BASE_URL}/v0/auth/users/reset_password/`,
    resetPasswordConfirm: `${BASE_URL}/v0/auth/users/reset_password_confirm/`,
  },
} as const;

export const handlers = [
  rest.get(urls.scenes.detail, (req, res, ctx) => {
    const { key } = req.params;
    if (typeof key !== "string") {
      throw new Error("key should be string");
    }
    const scene = db.scene.findFirst({
      where: { key: { equals: key } },
    });
    if (!scene) {
      return res(
        ctx.status(404),
        ctx.json({
          errorMessage: "Not found",
        }),
      );
    }
    const parsedScene = {
      ...scene,
      itemOrder: JSON.parse(scene.itemOrder),
    };
    return res(ctx.json(parsedScene));
  }),
  rest.post(urls.scenes.list, async (req, res, ctx) => {
    const { title, items, itemOrder } = await req.json();
    if (typeof title !== "string") {
      throw new Error("title should be string");
    }
    if (!Array.isArray(items)) {
      throw new Error("items should be array");
    }
    if (!itemOrder) {
      throw new Error("itemOrder should be object");
    }
    const scene = db.scene.create({
      title,
      items,
      itemOrder: JSON.stringify(itemOrder),
    });
    scene.itemOrder = JSON.parse(scene.itemOrder);
    return res(ctx.json(scene));
  }),
  rest.post(urls.auth.tokenLogin, async (req, res, ctx) => {
    const { email, password } = await req.json();
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
      return res(
        ctx.status(400),
        ctx.json({
          non_field_errors: ["Unable to log in with provided credentials."],
        }),
      );
    }
    return res(
      ctx.json({
        auth_token: "fake-token",
      }),
    );
  }),
  rest.post(urls.auth.tokenLogout, async (req, res, ctx) => {
    if (!hasValidToken(req)) {
      return res(
        ctx.status(401),
        ctx.json({
          errorMessage: "Invalid token",
        }),
      );
    }
    // The real API deletes the token, but that's not important for our tests.
    return res(ctx.status(204));
  }),
  rest.post(urls.auth.users, async (req, res, ctx) => {
    const { email, password } = await req.json();
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
    return res(
      ctx.json({
        public_nickname: user.public_nickname,
        email: user.email,
      }),
    );
  }),
  rest.post(urls.auth.activation, async (req, res, ctx) => {
    const { uid, token } = await req.json();
    if (typeof uid !== "string") {
      throw new Error("uid should be string");
    }
    if (typeof token !== "string") {
      throw new Error("token should be string");
    }
    return res(ctx.status(204));
  }),
  rest.post(urls.auth.resetPassword, async (req, res, ctx) => {
    return res(ctx.status(204));
  }),
  rest.post(urls.auth.resetPasswordConfirm, async (req, res, ctx) => {
    return res(ctx.status(204));
  }),
];
