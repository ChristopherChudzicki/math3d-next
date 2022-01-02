import type { Express } from "express";
import type { RouteSpec } from "../../util/routing";
import signup from "./signup";

export const routes: RouteSpec[] = [
  {
    route: "/user/signup",
    method: "post",
    handler: signup,
  },
  {
    route: "/user/login",
    method: "post",
    handler: (): void => {
      throw new Error("NotImplemented");
    },
  },
  {
    route: "/user",
    method: "post",
    handler: (): void => {
      throw new Error("NotImplemented");
    },
  },
];
