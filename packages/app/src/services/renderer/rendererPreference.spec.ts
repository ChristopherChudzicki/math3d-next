import { afterEach, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { storeRendererPreference } from "@/test_util/renderer";
import {
  resetRendererPreference,
  setRendererPreference,
  useRendererPreference,
} from "./rendererPreference";
import type { Renderer } from "./resolveRenderer";

afterEach(() => {
  vi.restoreAllMocks();
});

const choose = (renderer: Renderer) =>
  // The rule takes any function named like "render" for Testing Library's.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act(() => {
    setRendererPreference(renderer);
  });

test("reads what was stored", () => {
  const { result } = renderHook(useRendererPreference);

  choose("usegpu");
  act(resetRendererPreference);

  expect(result.current).toBe("usegpu");
  expect(localStorage.rendererPreference).toBe("usegpu");
});

test("a garbage value reads as unset", () => {
  storeRendererPreference("foo");

  const { result } = renderHook(useRendererPreference);

  expect(result.current).toBeNull();
});

test("storage that throws reads as unset and keeps the choice in memory", () => {
  storeRendererPreference("usegpu");
  const { result } = renderHook(useRendererPreference);
  expect(result.current).toBe("usegpu");
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  act(resetRendererPreference);
  expect(result.current).toBeNull();

  choose("usegpu");

  expect(result.current).toBe("usegpu");
});
