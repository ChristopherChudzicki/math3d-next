import React from "react";
import { test, expect } from "vitest";
import { act } from "@testing-library/react";
import { goBack, renderWithRouter } from "@/test_util/routerTesting";
import { useOverlay } from "./useOverlay";
import { useSignInDialog } from "./useSignInDialog";

const renderOverlayAndSignIn = async (url: string | string[]) => {
  const api: {
    overlay: ReturnType<typeof useOverlay> | null;
    signIn: ReturnType<typeof useSignInDialog> | null;
  } = { overlay: null, signIn: null };
  const Probe: React.FC = () => {
    api.overlay = useOverlay();
    api.signIn = useSignInDialog();
    return null;
  };
  const { router, location } = await renderWithRouter(<Probe />, { url });
  return { router, location, api };
};

test("Sign-in that replaced a pushed overlay closes back to the page beneath", async () => {
  const { router, location, api } = await renderOverlayAndSignIn([
    "/first",
    "/second",
  ]);
  await act(async () => api.overlay?.open("delete-account"));

  await act(async () => api.signIn?.open({ replaceOverlay: true }));
  expect(location.current.search).toBe("?signin=");
  await act(async () => api.signIn?.close());

  expect(location.current.pathname).toBe("/second");
  expect(location.current.search).toBe("");
  // The overlay's entry was popped, not left behind as a duplicate of /second.
  await goBack(router);
  expect(location.current.pathname).toBe("/first");
});

test("Sign-in that replaced a deep-linked overlay closes in place", async () => {
  const { location, api } = await renderOverlayAndSignIn(
    "/first?overlay=delete-account",
  );

  await act(async () => api.signIn?.open({ replaceOverlay: true }));
  await act(async () => api.signIn?.close());

  expect(location.current.pathname).toBe("/first");
  expect(location.current.search).toBe("");
});
