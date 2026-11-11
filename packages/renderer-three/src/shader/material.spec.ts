import { describe, expect, test } from "vitest";
import { DoubleSide } from "three/webgpu";
import { vec4 } from "three/tsl";
import { alphaOf, sharedMaterial } from "./material";

const shader = () => ({ vertex: vec4(0, 0, 0, 1), color: vec4(1, 0, 0, 1) });

describe("sharedMaterial", () => {
  test("builds one material per alpha, on first use", () => {
    let builds = 0;
    const material = sharedMaterial("mixed", () => {
      builds += 1;
      return shader();
    });
    expect(builds).toBe(0);
    expect(material("opaque")).toBe(material("opaque"));
    expect(material("translucent")).not.toBe(material("opaque"));
    expect(builds).toBe(2);
  });

  test.each([
    { alpha: "opaque", transparent: false },
    { alpha: "translucent", transparent: true },
    { alpha: "edges", transparent: true },
  ] as const)("$alpha: blends = $transparent", ({ alpha, transparent }) => {
    expect(sharedMaterial("mixed", shader)(alpha)).toMatchObject({
      transparent,
      depthWrite: true,
      side: DoubleSide,
    });
  });

  test.each([
    { facing: "uniform", forceSinglePass: true },
    { facing: "mixed", forceSinglePass: false },
  ] as const)(
    "$facing facing: one pass = $forceSinglePass",
    ({ facing, forceSinglePass }) => {
      expect(sharedMaterial(facing, shader)("translucent")).toMatchObject({
        forceSinglePass,
      });
    },
  );
});

test.each([
  { value: 1, alpha: "opaque" },
  { value: 0.5, alpha: "translucent" },
])("alphaOf($value) is $alpha", ({ value, alpha }) => {
  expect(alphaOf(value)).toBe(alpha);
});
