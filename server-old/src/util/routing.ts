import { Handler, Router } from "express";

// Add more as needed
type Method = "get" | "post";

type RouteSpec = {
  handler: Handler;
  method: Method;
  route: string;
};

const attachRoutes = (router: Router, routes: RouteSpec[]): void => {
  routes.forEach(({ route, handler, method }) => {
    router[method](route, async (req, res, next) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        next(error);
      }
    });
  });
};

export { attachRoutes, RouteSpec };
