import { createRouter } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
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
