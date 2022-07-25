import { rest } from "msw";
import db from "./db";

export const handlers = [
  rest.get("/scenes/:id", (req, res, ctx) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new Error("id should be string");
    }
    const scene = db.scene.findFirst({
      where: { id: { equals: id } },
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
