import React from "react";
import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router";
import { mockAuth, seedDb } from "@math3d/mock-api";
import AppProviders from "@/AppProviders";
import { getStore } from "@/store/store";
import {
  renderTestApp,
  screen,
  user,
  waitFor,
  waitForAppReady,
  within,
} from "@/test_util";
import UrlLayerHost from "./UrlLayerHost";

test("no overlay param renders no dialog", () => {
  renderTestApp("/");
  expect(screen.queryByRole("dialog")).toBe(null);
});

test("unknown overlay value renders nothing and is left in the URL", () => {
  const { location } = renderTestApp("/?overlay=bogus");
  expect(screen.queryByRole("dialog")).toBe(null);
  expect(location.current.search).toContain("overlay=bogus");
});

// `constructor` and `__proto__` are on every object's prototype chain; an
// overlay value naming one must still count as unknown, or it would keep the
// top-level sign-in from opening.
test.each(["constructor", "__proto__"])(
  "prototype-chain overlay value %s opens nothing and leaves sign-in free",
  async (value) => {
    const { location } = renderTestApp(`/?overlay=${value}&signin`);
    expect(
      await screen.findByRole("dialog", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(location.current.search).toContain(`overlay=${value}`);
  },
);

test("Sign-in loaded over an overlay hides the overlay and takes focus", async () => {
  renderTestApp("/?overlay=scenes&list=me&signin");

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
  const { location } = renderTestApp("/?overlay=scenes&list=me&signin");
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
  const router = createMemoryRouter([{ path: "*", element: <UrlLayerHost /> }]);
  render(
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
