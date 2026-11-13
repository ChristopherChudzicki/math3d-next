import { afterEach, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { storeRendererPreference } from "@/test_util";
import {
  resetRendererPreference,
  setRendererPreference,
  useRendererPreference,
} from "./rendererPreference";
import type { Renderer } from "./renderers";

afterEach(() => {
  vi.restoreAllMocks();
});

const choose = (renderer: Renderer) =>
  // The rule mistakes `setRendererPreference` for a Testing Library render.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act(() => {
    setRendererPreference(renderer);
  });

test("reads what was stored", () => {
  const { result } = renderHook(useRendererPreference);

  choose("mathbox");
  act(resetRendererPreference);

  expect(result.current).toBe("mathbox");
  expect(localStorage.renderer).toBe("mathbox");
});

test("a choice stored under the old key reads as unset", () => {
  localStorage.setItem("rendererPreference", "mathbox");
  resetRendererPreference();

  const { result } = renderHook(useRendererPreference);

  expect(result.current).toBeNull();
});

test("a garbage value reads as unset", () => {
  storeRendererPreference("foo");

  const { result } = renderHook(useRendererPreference);

  expect(result.current).toBeNull();
});

test("storage that throws reads as unset and keeps the choice in memory", () => {
  storeRendererPreference("mathbox");
  const { result } = renderHook(useRendererPreference);
  expect(result.current).toBe("mathbox");
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  act(resetRendererPreference);
  expect(result.current).toBeNull();

  choose("mathbox");

  expect(result.current).toBe("mathbox");
});
