import { expect, test } from "vitest";
import { resolveRenderer } from "./resolveRenderer";

test.each([
  {
    param: "mathbox",
    preference: "usegpu",
    webgpu: "available",
    expected: { renderer: "mathbox", notice: false },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "available",
    expected: { renderer: "usegpu", notice: false },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "pending",
    expected: { renderer: null, notice: false },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "unavailable",
    expected: { renderer: "mathbox", notice: true },
  },
  {
    param: "foo",
    preference: "usegpu",
    webgpu: "available",
    expected: { renderer: "usegpu", notice: false },
  },
  {
    param: null,
    preference: "usegpu",
    webgpu: "pending",
    expected: { renderer: null, notice: false },
  },
  {
    param: null,
    preference: "usegpu",
    webgpu: "unavailable",
    expected: { renderer: "mathbox", notice: false },
  },
  {
    param: null,
    preference: null,
    webgpu: "available",
    expected: { renderer: "mathbox", notice: false },
  },
] as const)(
  "?renderer=$param, preference $preference, WebGPU $webgpu",
  ({ expected, ...input }) => {
    expect(resolveRenderer(input)).toEqual(expected);
  },
);
