import { rest } from "msw";

export const handlers = [
  rest.get("/scene/:id", (req, res, ctx) => {
    console.log(req.params);
    return res(ctx.status(200), ctx.json({ scene: "cat" }));
  }),
];
