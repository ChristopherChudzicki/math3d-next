import { act, renderHook } from "@testing-library/react";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { useSpecCollector } from "./collector";

const spec = { kind: "point" } as GraphicSpec;

test("useSpecCollector keeps each id's latest spec and drops it on null", () => {
  const { result } = renderHook(() => useSpecCollector());
  act(() => result.current[1]("a", spec));
  act(() => result.current[1]("b", spec));
  expect(result.current[0]).toEqual({ a: spec, b: spec });
  act(() => result.current[1]("a", null));
  expect(result.current[0]).toEqual({ b: spec });
});

test("useSpecCollector keeps its specs' identity when a report changes nothing", () => {
  const { result } = renderHook(() => useSpecCollector());
  act(() => result.current[1]("a", spec));
  const before = result.current[0];
  act(() => result.current[1]("a", spec));
  act(() => result.current[1]("b", null));
  expect(result.current[0]).toBe(before);
});
