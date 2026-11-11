import { describe, expect, test } from "vitest";
import type { InstancedBufferGeometry } from "three/webgpu";
import type { Coords } from "@math3d/viewport-spec";
import { Discs } from "./Discs";
import type { DiscStyle } from "./discMaterial";

const style = (overrides: Partial<DiscStyle> = {}): DiscStyle => ({
  size: 8,
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
    const discs = new Discs();
    discs.set([[0, 0, 0], [NaN, 0, 0], ...points(2)], style());
    expect(instanceCounts(discs)).toEqual([3, 3]);
    discs.set(points(100), style());
    expect(instanceCounts(discs)).toEqual([100, 100]);
  });

  test("draws nothing without a finite point", () => {
    const discs = new Discs();
    discs.set([[Infinity, 0, 0]], style());
    expect(discs.objects.map((mesh) => mesh.visible)).toEqual([false, false]);
  });

  test("draws the rims after the fills", () => {
    const [fill, edge] = new Discs().objects;
    expect(edge.renderOrder).toBeGreaterThan(fill.renderOrder);
  });

  test("gives its meshes the style, as the shaders read it", () => {
    const discs = new Discs();
    const given = style();
    discs.set(points(1), given);
    discs.objects.forEach((mesh) => {
      const { color, ...numbers } = mesh.userData.disc;
      expect(color.toArray()).toEqual(given.color);
      expect(numbers).toEqual({
        size: given.size,
        zBias: given.zBias,
        zIndex: given.zIndex,
      });
    });
  });

  test("shares its materials with every other set of discs", () => {
    const materials = (discs: Discs) =>
      discs.objects.map((mesh) => mesh.material);
    const [fill, edge] = materials(new Discs());
    const [otherFill, otherEdge] = materials(new Discs());
    expect(fill).toBe(otherFill);
    expect(edge).toBe(otherEdge);
  });

  test("always blends the rims, and the fills only when translucent", () => {
    const discs = new Discs();
    const isBlended = () =>
      discs.objects.map(
        (mesh) => (mesh.material as { transparent: boolean }).transparent,
      );
    discs.set(points(1), style({ color: [1, 0, 0, 0.5] }));
    expect(isBlended()).toEqual([true, true]);
    discs.set(points(1), style());
    expect(isBlended()).toEqual([false, true]);
  });
});
