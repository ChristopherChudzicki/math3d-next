import type { RouteSpec } from "../../util/routing";
import signup from "./signup";
import create from "./create";
import login from "./login";

export const routes: RouteSpec[] = [
  {
    route: "/user/signup",
    method: "post",
    handler: signup,
  },
  {
    route: "/user/login",
    method: "post",
    handler: login,
  },
  {
    route: "/user",
    method: "post",
    handler: create,
  },
];
