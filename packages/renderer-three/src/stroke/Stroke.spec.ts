import { describe, expect, test } from "vitest";
import type { Coords } from "@math3d/viewport-spec";
import { Stroke } from "./Stroke";
import type { StrokeStyle } from "./style";

const style = (overrides: Partial<StrokeStyle> = {}): StrokeStyle => ({
  width: 4,
  color: [0.2, 0.4, 0.6, 1],
  zBias: 2,
  zIndex: 1,
  start: false,
  end: false,
  arrowSize: 6,
  ...overrides,
});

/** `count` two-point paths, as a vector field gives them. */
const vectors = (count: number): Coords[][] =>
  Array.from({ length: count }, (_, i) => [
    [i, 0, 0],
    [i, 1, 0],
  ]);

const instanceCounts = (stroke: Stroke) =>
  stroke.objects.map((mesh) => mesh.geometry.instanceCount);

describe("Stroke", () => {
  test("draws every path's segments in one mesh and its arrowheads in another", () => {
    const stroke = new Stroke("oit");
    stroke.set(vectors(100), style({ start: true, end: true }));
    expect(instanceCounts(stroke)).toEqual([100, 200]);
  });

  test("draws no arrowheads unless the style asks for them", () => {
    const stroke = new Stroke("oit");
    stroke.set(vectors(3), style());
    const [, arrows] = stroke.objects;
    expect(arrows.visible).toBe(false);
  });

  test("gives its meshes the style, as the shaders read it", () => {
    const stroke = new Stroke("oit");
    const given = style({ end: true });
    stroke.set(vectors(1), given);
    stroke.objects.forEach((mesh) => {
      const { color, ...numbers } = mesh.userData.stroke;
      expect(color.toArray()).toEqual(given.color);
      expect(numbers).toEqual({
        width: given.width,
        zBias: given.zBias,
        zIndex: given.zIndex,
        arrowSize: given.arrowSize,
        start: 0,
        end: 1,
      });
    });
  });

  test("shares its materials with every other stroke", () => {
    const materials = (stroke: Stroke) =>
      stroke.objects.map((mesh) => mesh.material);
    const [line, arrows] = materials(new Stroke("oit"));
    const [otherLine, otherArrows] = materials(new Stroke("oit"));
    expect(line).toBe(otherLine);
    expect(arrows).toBe(otherArrows);
  });

  test("blends a translucent stroke and not an opaque one", () => {
    const stroke = new Stroke("oit");
    const isBlended = () =>
      stroke.objects.map((mesh) => mesh.material.transparent);
    stroke.set(vectors(1), style({ color: [1, 0, 0, 0.5] }));
    expect(isBlended()).toEqual([true, true]);
    stroke.set(vectors(1), style());
    expect(isBlended()).toEqual([false, false]);
  });
});
