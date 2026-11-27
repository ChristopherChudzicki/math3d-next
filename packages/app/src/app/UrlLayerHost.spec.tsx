import React from "react";
import { test, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { mockAuth, seedDb } from "@math3d/mock-api";
import { getStore } from "@/store/store";
import {
  renderTestApp,
  screen,
  user,
  waitFor,
  waitForAppReady,
  within,
} from "@/test_util";
import { createTestRouter, renderRouter } from "@/test_util/routerTesting";
import AppProviders from "./AppProviders";
import UrlLayerHost from "./UrlLayerHost";

test("no overlay param renders no dialog", async () => {
  const { queryClient } = await renderTestApp("/");
  await waitForAppReady(queryClient);
  expect(screen.queryByRole("dialog")).toBe(null);
});

// `constructor` is on every object's prototype chain, so a lookup by name
// would find it.
test("an unknown overlay value is dropped, leaving sign-in free to open", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const { location } = await renderTestApp("/?overlay=constructor&signin");
  expect(
    await screen.findByRole("dialog", { name: "Sign in" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(location.current.search).toBe("?signin=");
  expect(error).toHaveBeenCalledWith(
    'Invalid value "constructor" for search parameter overlay',
  );
});

test("Sign-in loaded over an overlay hides the overlay and takes focus", async () => {
  await renderTestApp("/?overlay=scenes&list=me&signin");

  const signIn = await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() =>
    expect(within(signIn).getByRole("button", { name: "Close" })).toHaveFocus(),
  );
  expect(screen.queryByRole("dialog", { name: "Scenes" })).toBe(null);
  expect(
    screen.getByRole("dialog", { name: "Scenes", hidden: true }),
  ).toBeInTheDocument();
});

test("Escape closes sign-in and leaves the overlay beneath it open", async () => {
  const { location } = await renderTestApp("/?overlay=scenes&list=me&signin");
  const signIn = await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() =>
    expect(within(signIn).getByRole("button", { name: "Close" })).toHaveFocus(),
  );

  await user.keyboard("{Escape}");

  await waitFor(() =>
    expect(location.current.search).toBe("?overlay=scenes&list=me"),
  );
  expect(
    await screen.findByRole("dialog", { name: "Scenes" }),
  ).toBeInTheDocument();
});

test("Closed overlays run no queries and render no dialogs", async () => {
  mockAuth.setCurrentUser(seedDb.withUser().id);
  const queryClient = new QueryClient();
  const router = createTestRouter(<UrlLayerHost />);
  await renderRouter(
    router,
    <AppProviders
      queryClient={queryClient}
      store={getStore()}
      router={router}
    />,
  );

  await waitForAppReady(queryClient);
  // Session state is the only query an overlay may run while closed.
  const queryKeys = queryClient
    .getQueryCache()
    .getAll()
    .map((q) => q.queryKey);
  expect(queryKeys.filter(([key]) => key !== "me")).toEqual([]);
  expect(screen.queryAllByRole("dialog", { hidden: true })).toEqual([]);
  expect(screen.queryAllByRole("alertdialog", { hidden: true })).toEqual([]);
});
