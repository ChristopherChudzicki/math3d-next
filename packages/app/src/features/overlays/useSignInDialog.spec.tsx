import React from "react";
import { test, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useOverlay } from "./useOverlay";
import { useSignInDialog } from "./useSignInDialog";

const renderOverlayAndSignIn = (initialEntries: string[]) => {
  const api: {
    overlay: ReturnType<typeof useOverlay> | null;
    signIn: ReturnType<typeof useSignInDialog> | null;
  } = { overlay: null, signIn: null };
  const Probe: React.FC = () => {
    api.overlay = useOverlay();
    api.signIn = useSignInDialog();
    return null;
  };
  const router = createMemoryRouter([{ path: "*", element: <Probe /> }], {
    initialEntries,
  });
  render(<RouterProvider router={router} />);
  return { router, api };
};

test("Sign-in that replaced a pushed overlay closes back to the page beneath", async () => {
  const { router, api } = renderOverlayAndSignIn(["/first", "/second"]);
  await act(async () => api.overlay?.open("delete-account"));

  await act(async () => api.signIn?.open({ replaceOverlay: true }));
  expect(router.state.location.search).toBe("?signin=");
  await act(async () => api.signIn?.close());

  expect(router.state.location.pathname).toBe("/second");
  expect(router.state.location.search).toBe("");
  // The overlay's entry was popped, not left behind as a duplicate of /second.
  await act(async () => router.navigate(-1));
  expect(router.state.location.pathname).toBe("/first");
});

test("Sign-in that replaced a deep-linked overlay closes in place", async () => {
  const { router, api } = renderOverlayAndSignIn([
    "/first?overlay=delete-account",
  ]);

  await act(async () => api.signIn?.open({ replaceOverlay: true }));
  await act(async () => api.signIn?.close());

  expect(router.state.location.pathname).toBe("/first");
  expect(router.state.location.search).toBe("");
});
