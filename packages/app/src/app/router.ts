import { createRouter } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import type { ROUTE_PATHS } from "@/worker/routes";
import { routeTree } from "./routeTree.gen";
import type { FileRouteTypes } from "./routeTree.gen";
import { ROUTER_OPTIONS } from "./routerOptions";

/** The app's router; tests pass a memory history. */
export const createAppRouter = ({
  history,
}: { history?: RouterHistory } = {}) =>
  createRouter({ ...ROUTER_OPTIONS, routeTree, history });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}

type RoutePaths = FileRouteTypes["fullPaths"];
type WorkerPaths = (typeof ROUTE_PATHS)[number];
type None<T extends never> = T;
/** The metadata Worker answers 404 for a path missing from ROUTE_PATHS, so a
 * path on one side only fails typecheck here, naming it. */
export type WorkerRouteMismatch = None<
  Exclude<RoutePaths, WorkerPaths> | Exclude<WorkerPaths, RoutePaths>
>;
