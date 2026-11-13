import { expect, test } from "vitest";
import { resolveRenderer } from "./resolveRenderer";

test.each([
  { param: "mathbox", preference: "threejs", expected: "mathbox" },
  { param: "foo", preference: "threejs", expected: "threejs" },
  { param: null, preference: null, expected: "mathbox" },
] as const)(
  "?renderer=$param, preference $preference → $expected",
  ({ expected, ...input }) => {
    expect(resolveRenderer(input)).toBe(expected);
  },
);
