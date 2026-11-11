import { describe, expect, test } from "vitest";
import { CustomBlending, DoubleSide, NormalBlending } from "three/webgpu";
import { vec4 } from "three/tsl";
import { opacityOf, sharedMaterial } from "./material";

const shader = () => ({ vertex: vec4(0, 0, 0, 1), color: vec4(1, 0, 0, 1) });

describe("sharedMaterial", () => {
  test("builds one two-sided material per alpha and model, on first use", () => {
    let builds = 0;
    const material = sharedMaterial("mixed", () => {
      builds += 1;
      return shader();
    });
    expect(builds).toBe(0);
    const opaque = material("opaque", "oit");
    expect(material("opaque", "oit")).toBe(opaque);
    expect(material("translucent", "oit")).not.toBe(opaque);
    expect(material("opaque", "ordered")).not.toBe(opaque);
    expect(builds).toBe(3);
    expect(opaque.side).toBe(DoubleSide);
  });

  // three's OIT pass accumulates a material that is `transparent` with
  // `NormalBlending`, and nothing else.
  test.each([
    {
      alpha: "opaque",
      flags: { transparent: false, depthWrite: true },
    },
    {
      alpha: "translucent",
      flags: { transparent: true, blending: NormalBlending, depthWrite: false },
    },
    {
      alpha: "edges",
      flags: { transparent: true, blending: CustomBlending, depthWrite: true },
    },
  ] as const)(
    "oit: a mark of $alpha alpha accumulates only if translucent",
    (c) => {
      expect(sharedMaterial("mixed", shader)(c.alpha, "oit")).toMatchObject({
        ...c.flags,
        forceSinglePass: true,
      });
    },
  );

  // Only a translucent mark whose triangles face both ways needs three's
  // back-then-front passes.
  test.each([
    { facing: "mixed", alpha: "translucent", forceSinglePass: false },
    { facing: "mixed", alpha: "opaque", forceSinglePass: true },
    { facing: "uniform", alpha: "translucent", forceSinglePass: true },
  ] as const)(
    "ordered: a $alpha mark of $facing facing blends, writes depth and sets forceSinglePass $forceSinglePass",
    ({ facing, alpha, forceSinglePass }) => {
      expect(sharedMaterial(facing, shader)(alpha, "ordered")).toMatchObject({
        transparent: true,
        blending: NormalBlending,
        depthWrite: true,
        forceSinglePass,
      });
    },
  );
});

test.each([
  { alpha: 1, opacity: "opaque" },
  { alpha: 0.5, opacity: "translucent" },
])("opacityOf($alpha) is $opacity", ({ alpha, opacity }) => {
  expect(opacityOf(alpha)).toBe(opacity);
});
