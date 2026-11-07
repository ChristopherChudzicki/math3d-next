import { expect, test } from "vitest";
import { resolveRenderer } from "./resolveRenderer";

test.each([
  {
    param: "mathbox",
    preference: "usegpu",
    webgpu: "available",
    expected: { renderer: "mathbox", notice: null },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "available",
    expected: { renderer: "usegpu", notice: null },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "pending",
    expected: { renderer: null, notice: null },
  },
  {
    param: "usegpu",
    preference: "mathbox",
    webgpu: "unavailable",
    expected: { renderer: "mathbox", notice: "link" },
  },
  {
    param: "foo",
    preference: "usegpu",
    webgpu: "available",
    expected: { renderer: "usegpu", notice: null },
  },
  {
    param: null,
    preference: "usegpu",
    webgpu: "pending",
    expected: { renderer: null, notice: null },
  },
  {
    param: null,
    preference: "usegpu",
    webgpu: "unavailable",
    expected: { renderer: "mathbox", notice: null },
  },
  {
    param: "usegpu",
    preference: null,
    webgpu: "failed",
    expected: { renderer: "mathbox", notice: "failed" },
  },
  {
    param: null,
    preference: "mathbox",
    webgpu: "failed",
    expected: { renderer: "mathbox", notice: "failed" },
  },
  {
    param: null,
    preference: null,
    webgpu: "available",
    expected: { renderer: "mathbox", notice: null },
  },
] as const)(
  "?renderer=$param, preference $preference, WebGPU $webgpu → $expected.renderer, notice $expected.notice",
  ({ expected, ...input }) => {
    expect(resolveRenderer(input)).toEqual(expected);
  },
);
