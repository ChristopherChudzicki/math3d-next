import { describe, expect, test } from "vitest";
import { NormalBlending } from "three/webgpu";
import type { InstancedBufferGeometry } from "three/webgpu";
import type { Coords } from "@math3d/viewport-spec";
import { Discs } from "./Discs";
import { edgeMaterial, fillMaterial } from "./discMaterial";
import type { DiscStyle } from "./discMaterial";

const style = (overrides: Partial<DiscStyle> = {}): DiscStyle => ({
  diameter: 8,
  color: [0.2, 0.4, 0.6, 1],
  zBias: 2,
  zIndex: 1,
  ...overrides,
});

const points = (count: number): Coords[] =>
  Array.from({ length: count }, (_, i) => [i, 0, 0]);

const instanceCounts = (discs: Discs) =>
  discs.objects.map(
    (mesh) => (mesh.geometry as InstancedBufferGeometry).instanceCount,
  );

describe("Discs", () => {
  test("draws a fill and a rim for each finite point, in one mesh each", () => {
    const discs = new Discs("oit");
    discs.set([[0, 0, 0], [NaN, 0, 0], ...points(2)], style());
    expect(instanceCounts(discs)).toEqual([3, 3]);
  });

  test.each([
    {
      without: "a finite point",
      at: [[Infinity, 0, 0]] as Coords[],
      given: style(),
    },
    { without: "a size", at: points(1), given: style({ diameter: 0 }) },
    {
      without: "an opacity",
      at: points(1),
      given: style({ color: [1, 0, 0, 0] }),
    },
  ])("draws nothing without $without", ({ at, given }) => {
    const discs = new Discs("oit");
    discs.set(at, given);
    expect(discs.objects.map((mesh) => mesh.visible)).toEqual([false, false]);
  });

  test("draws the rims after the fills", () => {
    const [fill, edge] = new Discs("oit").objects;
    expect(edge.renderOrder).toBeGreaterThan(fill.renderOrder);
  });

  test("gives its meshes the style, as the shaders read it", () => {
    const discs = new Discs("oit");
    const given = style();
    discs.set(points(1), given);
    discs.objects.forEach((mesh) => {
      const { color, ...numbers } = mesh.userData.disc;
      expect(color.toArray()).toEqual(given.color);
      expect(numbers).toEqual({
        diameter: given.diameter,
        zBias: given.zBias,
        zIndex: given.zIndex,
      });
    });
  });

  test("shares its materials with every other set of discs", () => {
    const materials = (discs: Discs) =>
      discs.objects.map((mesh) => mesh.material);
    const [fill, edge] = materials(new Discs("oit"));
    const [otherFill, otherEdge] = materials(new Discs("oit"));
    expect(fill).toBe(otherFill);
    expect(edge).toBe(otherEdge);
  });

  test("an opaque disc's rim only antialiases it; a translucent disc's is as translucent as its fill", () => {
    const discs = new Discs("oit");
    const [fill, edge] = discs.objects;
    discs.set(points(1), style());
    expect(fill.material).toBe(fillMaterial("opaque", "oit"));
    expect(edge.material).toBe(edgeMaterial("opaque", "oit"));
    expect(edge.material).toMatchObject({
      transparent: true,
      depthWrite: true,
    });
    discs.set(points(1), style({ color: [1, 0, 0, 0.5] }));
    expect(fill.material).toBe(fillMaterial("translucent", "oit"));
    expect(edge.material).toBe(edgeMaterial("translucent", "oit"));
    // Like the fill, it goes through the OIT pass rather than blending in place.
    expect(edge.material.depthWrite).toBe(false);
  });

  test("under the ordered model, blends opaque discs too", () => {
    const discs = new Discs("ordered");
    discs.set(points(1), style());
    discs.objects.forEach((mesh) =>
      expect(mesh.material).toMatchObject({
        transparent: true,
        blending: NormalBlending,
        depthWrite: true,
      }),
    );
  });
});
