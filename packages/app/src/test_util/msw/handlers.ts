import { rest } from "msw";
import db from "./db";

export const handlers = [
  rest.get("http://localhost:3000/api/scenes/:key/", (req, res, ctx) => {
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
        })
      );
    }
    const parsedScene = {
      ...scene,
      itemOrder: JSON.parse(scene.itemOrder),
    };
    return res(ctx.json(parsedScene));
  }),
];
