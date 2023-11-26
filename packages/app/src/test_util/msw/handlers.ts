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

export const handlers = [
  rest.get("http://localhost:8000/v0/scenes/:key/", (req, res, ctx) => {
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
  rest.post("http://localhost:8000/v0/scenes/", async (req, res, ctx) => {
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
  rest.post(
    "http://localhost:8000/v0/auth/token/login/",
    async (req, res, ctx) => {
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
      if (!user) {
        return res(
          ctx.status(404),
          ctx.json({
            errorMessage: "Not found",
          }),
        );
      }
      if (user.password !== password) {
        return res(
          ctx.status(400),
          ctx.json({
            errorMessage: "Invalid password",
          }),
        );
      }
      return res(
        ctx.json({
          auth_token: "fake-token",
        }),
      );
    },
  ),
  rest.post(
    "http://localhost:8000/v0/auth/token/logout/",
    async (req, res, ctx) => {
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
    },
  ),
];
