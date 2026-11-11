import { describe, expect, test } from "vitest";
import { CustomBlending, DoubleSide, NormalBlending } from "three/webgpu";
import { vec4 } from "three/tsl";
import { alphaOf, sharedMaterial } from "./material";

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
  ] as const)("oit: only a translucent mark accumulates ($alpha)", (c) => {
    expect(sharedMaterial("mixed", shader)(c.alpha, "oit")).toMatchObject({
      ...c.flags,
      forceSinglePass: true,
    });
  });

  test.each(["opaque", "translucent", "edges"] as const)(
    "ordered: a mark of %s alpha blends and writes depth",
    (alpha) => {
      expect(sharedMaterial("mixed", shader)(alpha, "ordered")).toMatchObject({
        transparent: true,
        blending: NormalBlending,
        depthWrite: true,
      });
    },
  );

  test.each([
    { facing: "uniform", forceSinglePass: true },
    { facing: "mixed", forceSinglePass: false },
  ] as const)(
    "ordered: $facing facing draws in one pass = $forceSinglePass",
    ({ facing, forceSinglePass }) => {
      expect(
        sharedMaterial(facing, shader)("translucent", "ordered"),
      ).toMatchObject({ forceSinglePass });
    },
  );
});

test.each([
  { value: 1, alpha: "opaque" },
  { value: 0.5, alpha: "translucent" },
])("alphaOf($value) is $alpha", ({ value, alpha }) => {
  expect(alphaOf(value)).toBe(alpha);
});
