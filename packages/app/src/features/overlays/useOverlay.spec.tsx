import React from "react";
import { test, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useOverlay } from "./useOverlay";

const renderOverlay = (initialEntries: string[]) => {
  const api: { current: ReturnType<typeof useOverlay> | null } = {
    current: null,
  };
  const Probe: React.FC = () => {
    api.current = useOverlay();
    return null;
  };
  const router = createMemoryRouter([{ path: "*", element: <Probe /> }], {
    initialEntries,
  });
  render(<RouterProvider router={router} />);
  return { router, api };
};

test("Closing an overlay pops the entry that opened it", async () => {
  const { router, api } = renderOverlay(["/first", "/second"]);

  await act(async () => api.current?.open("login"));
  expect(router.state.location.search).toBe("?overlay=login");

  await act(async () => api.current?.close());
  expect(router.state.location.search).toBe("");

  // The entry `open` pushed is gone, so the next Back press reaches what came
  // before the overlay instead of repeating /second.
  await act(async () => router.navigate(-1));
  expect(router.state.location.pathname).toBe("/first");
});

test("Closing twice pops once, so a double close does not leave the app", async () => {
  const { router, api } = renderOverlay(["/first", "/second"]);

  await act(async () => api.current?.open("login"));
  // LogoutPage closes from two places: its mutation and its auth-status effect.
  await act(async () => {
    api.current?.close();
    api.current?.close();
  });

  expect(router.state.location.pathname).toBe("/second");
  expect(router.state.location.search).toBe("");
});

test("Closing a deep-linked overlay drops the params without leaving the app", async () => {
  const { router, api } = renderOverlay(["/first?overlay=login"]);

  await act(async () => api.current?.close());

  expect(router.state.location.search).toBe("");
  expect(router.state.location.pathname).toBe("/first");
});

test("Closing an overlay switched into from a deep link stays in the app", async () => {
  const { router, api } = renderOverlay(["/first?overlay=delete-account"]);

  // Switching replaces, so there is still no entry of ours to pop.
  await act(async () => api.current?.open("login"));
  await act(async () => api.current?.close());

  expect(router.state.location.search).toBe("");
  expect(router.state.location.pathname).toBe("/first");
});
