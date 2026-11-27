import React from "react";
import { act, render } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import type {
  AnyRouter,
  HistoryState,
  ParsedLocation,
} from "@tanstack/react-router";
import { ROUTER_OPTIONS } from "@/app/routerOptions";
import { rootSearchFields } from "@/app/searchFields";
import { lenientSearch } from "@/util/lenientSearch";

/**
 * A memory history at `url`, or at the last of several entries, the current
 * entry carrying `state`. Seeded before a router exists, so the router's first
 * load sees it.
 */
export const memoryHistory = (url: string | string[], state?: HistoryState) => {
  const initialEntries = typeof url === "string" ? [url] : url;
  const history = createMemoryHistory({
    initialEntries,
    initialIndex: initialEntries.length - 1,
  });
  if (state) history.replace(initialEntries[initialEntries.length - 1], state);
  return history;
};

/** A location as specs assert on it: `search` and `hash` as in the URL. */
export const testLocation = ({
  pathname,
  searchStr,
  hash,
  state,
}: ParsedLocation) => ({
  pathname,
  search: searchStr,
  hash: hash ? `#${hash}` : "",
  state,
});

/**
 * Renders `ui` (by default just `router`) once the router's first load is
 * done, so the first render is complete. Mounting rewrites a URL the router
 * would write differently (a bad search value dropped) and loads it again, in
 * microtasks that the async `act` here flushes.
 */
export const renderRouter = async (
  router: AnyRouter,
  ui: React.ReactElement = <RouterProvider router={router} />,
) => {
  await router.load();
  const result = render(ui);
  await act(async () => {});
  return result;
};

type TestRouterOptions = { url?: string | string[]; state?: HistoryState };

/**
 * A router with the app's options that renders `ui` at any URL, under one
 * root route with the app's search params.
 */
export const createTestRouter = (
  ui: React.ReactElement,
  { url = "/", state }: TestRouterOptions = {},
) =>
  createRouter({
    ...ROUTER_OPTIONS,
    routeTree: createRootRoute({
      validateSearch: lenientSearch(rootSearchFields),
      component: () => ui,
    }),
    history: memoryHistory(url, state),
  });

/** Renders `ui` at `url`; see {@link createTestRouter}. */
export const renderWithRouter = async (
  ui: React.ReactElement,
  options?: TestRouterOptions,
) => {
  const router = createTestRouter(ui, options);
  // Not the render result: its `rerender` would replace the router.
  const { unmount } = await renderRouter(router);
  return {
    unmount,
    router,
    location: {
      get current() {
        return testLocation(router.state.location);
      },
    },
  };
};

/** Pushes `href`, as a link would, and waits for the route to load. */
export const navigateTo = (
  router: AnyRouter,
  href: string,
  { state }: { state?: HistoryState } = {},
) => act(() => router.navigate({ href, state }));

/** The browser's Back button. */
export const goBack = (router: AnyRouter) =>
  act(async () => {
    router.history.back();
  });

/** The browser's Forward button. */
export const goForward = (router: AnyRouter) =>
  act(async () => {
    router.history.forward();
  });
