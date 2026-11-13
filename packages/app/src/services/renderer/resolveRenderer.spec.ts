import { expect, test } from "vitest";
import { resolveRenderer } from "./resolveRenderer";

test.each([
  { param: "mathbox", preference: "threejs", expected: "mathbox" },
  { param: "usegpu", preference: "mathbox", expected: "mathbox" },
  { param: null, preference: null, expected: "threejs" },
] as const)(
  "?renderer=$param, preference $preference → $expected",
  ({ expected, ...input }) => {
    expect(resolveRenderer(input)).toBe(expected);
  },
);
