import React from "react";
import { test, expect, onTestFinished } from "vitest";
import {
  createBrowserHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { act } from "@testing-library/react";
import {
  goBack,
  renderRouter,
  renderWithRouter,
} from "@/test_util/routerTesting";
import { useOverlay } from "./useOverlay";

const renderOverlay = async (url: string | string[]) => {
  const api: { current: ReturnType<typeof useOverlay> | null } = {
    current: null,
  };
  const Probe: React.FC = () => {
    api.current = useOverlay();
    return null;
  };
  const { router, location, unmount } = await renderWithRouter(<Probe />, {
    url,
  });
  return { router, location, api, unmount };
};

test("Closing an overlay pops the entry that opened it", async () => {
  const { router, location, api } = await renderOverlay(["/first", "/second"]);

  await act(async () => api.current?.open("logout"));
  expect(location.current.search).toBe("?overlay=logout");

  await act(async () => api.current?.close());
  expect(location.current.search).toBe("");

  // The entry `open` pushed is gone, so the next Back press reaches what came
  // before the overlay instead of repeating /second.
  await goBack(router);
  expect(location.current.pathname).toBe("/first");
});

test("Closing twice pops once, so a double close does not leave the app", async () => {
  const { location, api } = await renderOverlay(["/first", "/second"]);

  await act(async () => api.current?.open("logout"));
  // LogoutPage closes from two places: its mutation and its auth-status effect.
  await act(async () => {
    api.current?.close();
    api.current?.close();
  });

  expect(location.current.pathname).toBe("/second");
  expect(location.current.search).toBe("");
});

test("Closing a deep-linked overlay drops the params without leaving the app", async () => {
  const { location, api } = await renderOverlay("/first?overlay=logout");

  await act(async () => api.current?.close());

  expect(location.current.search).toBe("");
  expect(location.current.pathname).toBe("/first");
});

test("Closing an overlay switched into from a deep link stays in the app", async () => {
  const { location, api } = await renderOverlay(
    "/first?overlay=delete-account",
  );

  // Switching replaces, so there is still no entry of ours to pop.
  await act(async () => api.current?.open("logout"));
  await act(async () => api.current?.close());

  expect(location.current.search).toBe("");
  expect(location.current.pathname).toBe("/first");
});

test("A close from an unmounted component does nothing", async () => {
  const { location, api, unmount } = await renderOverlay(["/first", "/second"]);

  await act(async () => api.current?.open("logout"));
  // A mutation's handler can outlive the component that called it, still
  // holding that render's `close`.
  const staleClose = api.current?.close;

  unmount();
  await act(async () => staleClose?.());

  // Popping here would take the entry the user is on now, whatever that is.
  expect(location.current.search).toBe("?overlay=logout");
  expect(location.current.pathname).toBe("/second");
});

test("An overlay on a history entry React Router wrote still closes", async () => {
  // React Router's own state shape; TanStack gives such an entry no key.
  window.history.replaceState(
    { usr: null, key: "default", idx: 0 },
    "",
    "/first?overlay=logout",
  );
  onTestFinished(() => window.history.replaceState(null, "", "/"));
  const api: { current: ReturnType<typeof useOverlay> | null } = {
    current: null,
  };
  const Probe: React.FC = () => {
    api.current = useOverlay();
    return null;
  };
  const router = createRouter({
    routeTree: createRootRoute({ component: Probe }),
    history: createBrowserHistory(),
  });
  onTestFinished(() => router.history.destroy());
  await renderRouter(router);

  await act(async () => api.current?.close());

  expect(window.location.search).toBe("");
});
