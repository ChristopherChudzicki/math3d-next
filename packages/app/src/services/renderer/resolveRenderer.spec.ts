import { expect, test } from "vitest";
import { resolveRenderer } from "./resolveRenderer";

test.each([
  {
    param: "mathbox",
    preference: "usegpu",
    webgpu: "available",
    expected: { requested: "mathbox", renderer: "mathbox", notice: null },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "available",
    expected: { requested: "usegpu", renderer: "usegpu", notice: null },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "pending",
    expected: { requested: "usegpu", renderer: null, notice: null },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "unavailable",
    expected: { requested: "usegpu", renderer: "mathbox", notice: "link" },
  },
  {
    param: "foo",
    preference: "usegpu",
    webgpu: "available",
    expected: { requested: "usegpu", renderer: "usegpu", notice: null },
  },
  {
    param: null,
    preference: "usegpu",
    webgpu: "pending",
    expected: { requested: "usegpu", renderer: null, notice: null },
  },
  {
    param: null,
    preference: "usegpu",
    webgpu: "unavailable",
    expected: { requested: "usegpu", renderer: "mathbox", notice: null },
  },
  {
    param: "usegpu",
    preference: null,
    webgpu: "failed",
    expected: { requested: "usegpu", renderer: "mathbox", notice: "failed" },
  },
  {
    param: null,
    preference: "mathbox",
    webgpu: "failed",
    expected: { requested: "mathbox", renderer: "mathbox", notice: "failed" },
  },
  {
    param: null,
    preference: null,
    webgpu: "available",
    expected: { requested: "mathbox", renderer: "mathbox", notice: null },
  },
  {
    param: "threejs",
    preference: "usegpu",
    webgpu: "pending",
    expected: { requested: "threejs", renderer: "threejs", notice: null },
  },
  {
    param: null,
    preference: "threejs",
    webgpu: "failed",
    expected: { requested: "threejs", renderer: "threejs", notice: "failed" },
  },
] as const)(
  "?renderer=$param, preference $preference, WebGPU $webgpu → $expected.renderer, notice $expected.notice",
  ({ expected, ...input }) => {
    expect(resolveRenderer(input)).toEqual(expected);
  },
);
