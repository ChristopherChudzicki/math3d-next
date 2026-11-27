import React from "react";
import { test, expect } from "vitest";
import { act } from "@testing-library/react";
import { useLocation } from "@tanstack/react-router";
import { goBack, goForward, renderWithRouter } from "@/test_util/routerTesting";
import { useOverlay } from "./useOverlay";
import { UrlLayer, useUrlLayerLocation } from "./UrlLayer";

/**
 * Mounts a probe inside a layer that is open while `?overlay=` is set, the way
 * UrlLayerHost keeps an overlay mounted while closed. Overlays open from outside
 * any layer, as from the header.
 */
const renderUrlLayer = async (url: string | string[]) => {
  const api: {
    open: ReturnType<typeof useOverlay>["open"] | null;
    close: ReturnType<typeof useOverlay>["close"] | null;
    location: ReturnType<typeof useUrlLayerLocation> | null;
  } = { open: null, close: null, location: null };
  const Probe: React.FC = () => {
    api.close = useOverlay().close;
    api.location = useUrlLayerLocation();
    return null;
  };
  const Host: React.FC = () => {
    api.open = useOverlay().open;
    return (
      <UrlLayer open={useLocation().search.overlay !== undefined}>
        <Probe />
      </UrlLayer>
    );
  };
  const { router, location } = await renderWithRouter(<Host />, { url });
  return { router, location, api };
};

test("A closed layer keeps the location it last had open", async () => {
  const { location, api } = await renderUrlLayer("/");

  await act(async () => api.open?.("scenes", { list: "me" }));
  await act(async () => api.close?.());

  expect(location.current.search).toBe("");
  expect(api.location?.searchStr).toBe("?overlay=scenes&list=me");
});

test("A close captured while open does nothing once Back closed the layer", async () => {
  const { router, location, api } = await renderUrlLayer(["/first", "/second"]);

  await act(async () => api.open?.("logout"));
  // LogoutPage closes after awaiting its mutation, from this render's `close`.
  const staleClose = api.close;
  await goBack(router);
  await act(async () => staleClose?.());

  // Popping here would take the entry the user is on now.
  expect(location.current.pathname).toBe("/second");
});

test("An overlay reached again by Forward can still be closed", async () => {
  const { router, location, api } = await renderUrlLayer(["/first", "/second"]);

  await act(async () => api.open?.("logout"));
  await act(async () => api.close?.());
  await goForward(router);
  expect(location.current.search).toBe("?overlay=logout");

  await act(async () => api.close?.());

  expect(location.current.search).toBe("");
});
