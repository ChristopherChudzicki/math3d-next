import type { RestHandler } from "msw";
import db from "./db";

type HandlerInfo = Pick<RestHandler["info"], "method" | "path">;

const handlerKey = (info: HandlerInfo) =>
  JSON.stringify([info.method, info.path]);
const filterHandlers = (handlers: RestHandler[], infos: HandlerInfo[]) => {
  const keep = new Set(infos.map(handlerKey));
  return handlers.filter((h) => keep.has(handlerKey(h.info)));
};

const sceneHandlers = filterHandlers(db.scene.toHandlers("rest"), [
  { method: "GET", path: "/scenes/:id" },
]);

export const handlers = [...sceneHandlers];
