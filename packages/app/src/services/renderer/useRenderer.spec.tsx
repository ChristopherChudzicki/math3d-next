import React from "react";
import { expect, test } from "vitest";
import { act, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { InitialEntry } from "react-router";
import { useRendererPreference } from "./rendererPreference";
import { useRenderer } from "./useRenderer";

const renderUseRenderer = (initialEntry: InitialEntry) => {
  const api: {
    current: {
      renderer: ReturnType<typeof useRenderer>;
      preference: ReturnType<typeof useRendererPreference>;
    } | null;
  } = { current: null };
  const Probe: React.FC = () => {
    api.current = {
      renderer: useRenderer(),
      preference: useRendererPreference(),
    };
    return null;
  };
  const router = createMemoryRouter([{ path: "*", element: <Probe /> }], {
    initialEntries: [initialEntry],
  });
  render(<RouterProvider router={router} />);
  return { router, api };
};

test("chooseRenderer stores the choice and drops only ?renderer", async () => {
  const { router, api } = renderUseRenderer({
    pathname: "/abc",
    search: "?renderer=usegpu&controls=0&overlay=scenes&list=examples",
    hash: "#h",
    state: { x: 1 },
  });

  await act(async () => api.current?.renderer.chooseRenderer("mathbox"));

  expect(api.current?.preference).toBe("mathbox");
  const { location } = router.state;
  expect(location.pathname).toBe("/abc");
  expect(location.search).toBe("?controls=0&overlay=scenes&list=examples");
  expect(location.hash).toBe("#h");
  expect(location.state).toEqual({ x: 1 });
  expect(router.state.historyAction).toBe("REPLACE");
});

test("chooseRenderer doesn't navigate without ?renderer", async () => {
  const { router, api } = renderUseRenderer("/abc");
  const { key } = router.state.location;

  await act(async () => api.current?.renderer.chooseRenderer("usegpu"));

  expect(api.current?.preference).toBe("usegpu");
  expect(router.state.location.key).toBe(key);
});
