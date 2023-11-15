import { rest } from "msw";
import db from "./db";

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
];
