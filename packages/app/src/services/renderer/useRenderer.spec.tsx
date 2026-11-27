import React from "react";
import { expect, test } from "vitest";
import { act } from "@testing-library/react";
import { renderWithRouter } from "@/test_util/routerTesting";
import { useRendererPreference } from "./rendererPreference";
import { useRenderer } from "./useRenderer";

const renderUseRenderer = async (
  options: Parameters<typeof renderWithRouter>[1],
) => {
  const api: {
    current: {
      hook: ReturnType<typeof useRenderer>;
      preference: ReturnType<typeof useRendererPreference>;
    } | null;
  } = { current: null };
  const Probe: React.FC = () => {
    api.current = {
      hook: useRenderer(),
      preference: useRendererPreference(),
    };
    return null;
  };
  const { router, location } = await renderWithRouter(<Probe />, options);
  return { router, location, api };
};

test("chooseRenderer stores the choice and drops only ?renderer", async () => {
  const { location, api } = await renderUseRenderer({
    url: "/abc?renderer=mathbox&controls=0&overlay=scenes&list=examples#h",
    state: { overlayPushed: true },
  });
  const entry = location.current.state.__TSR_index;

  await act(async () => api.current?.hook.chooseRenderer("threejs"));

  expect(api.current?.preference).toBe("threejs");
  expect(location.current).toMatchObject({
    pathname: "/abc",
    search: "?controls=0&overlay=scenes&list=examples",
    hash: "#h",
    state: { overlayPushed: true },
  });
  // Replaced, not pushed.
  expect(location.current.state.__TSR_index).toBe(entry);
});

test("chooseRenderer doesn't navigate without ?renderer", async () => {
  const { location, api } = await renderUseRenderer({ url: "/abc" });
  const key = location.current.state.__TSR_key;

  await act(async () => api.current?.hook.chooseRenderer("mathbox"));

  expect(api.current?.preference).toBe("mathbox");
  expect(location.current.state.__TSR_key).toBe(key);
});
