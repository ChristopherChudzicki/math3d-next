import React from "react";
import { test, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { useOverlay } from "./useOverlay";
import { OverlayLayer, useLayerLocation } from "./OverlayLayer";

/**
 * Mounts a probe inside a layer that is open while `?overlay=` is set, the way
 * OverlayHost keeps an overlay mounted while closed. Overlays open from outside
 * any layer, as from the header.
 */
const renderLayer = (initialEntries: string[]) => {
  const api: {
    open: ReturnType<typeof useOverlay>["open"] | null;
    close: ReturnType<typeof useOverlay>["close"] | null;
    location: ReturnType<typeof useLayerLocation> | null;
  } = { open: null, close: null, location: null };
  const Probe: React.FC = () => {
    api.close = useOverlay().close;
    api.location = useLayerLocation();
    return null;
  };
  const Layer: React.FC = () => {
    api.open = useOverlay().open;
    return (
      <OverlayLayer
        open={new URLSearchParams(useLocation().search).has("overlay")}
      >
        <Probe />
      </OverlayLayer>
    );
  };
  const router = createMemoryRouter([{ path: "*", element: <Layer /> }], {
    initialEntries,
  });
  render(<RouterProvider router={router} />);
  return { router, api };
};

test("A closed layer keeps the location it last had open", async () => {
  const { router, api } = renderLayer(["/"]);

  await act(async () => api.open?.("scenes", { list: "me" }));
  await act(async () => api.close?.());

  expect(router.state.location.search).toBe("");
  expect(api.location?.search).toBe("?overlay=scenes&list=me");
});

test("A close captured while open does nothing once Back closed the layer", async () => {
  const { router, api } = renderLayer(["/first", "/second"]);

  await act(async () => api.open?.("logout"));
  // LogoutPage closes after awaiting its mutation, from this render's `close`.
  const staleClose = api.close;
  await act(async () => router.navigate(-1));
  await act(async () => staleClose?.());

  // Popping here would take the entry the user is on now.
  expect(router.state.location.pathname).toBe("/second");
});

test("An overlay reached again by Forward can still be closed", async () => {
  const { router, api } = renderLayer(["/first", "/second"]);

  await act(async () => api.open?.("logout"));
  await act(async () => api.close?.());
  await act(async () => router.navigate(1));
  expect(router.state.location.search).toBe("?overlay=logout");

  await act(async () => api.close?.());

  expect(router.state.location.search).toBe("");
});
