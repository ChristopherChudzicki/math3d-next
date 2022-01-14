import type { RouteSpec } from "../../util/routing";
import getScene from "./getScene";

export const routes: RouteSpec[] = [
  {
    method: "get",
    route: "/scene/:sceneId",
    handler: getScene,
  },
];
