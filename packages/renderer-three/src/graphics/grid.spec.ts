import { describe, expect, test } from "vitest";
import type { InstancedBufferGeometry, Mesh } from "three/webgpu";
import type { GridSpec } from "@math3d/viewport-spec";
import { buildGrid } from "./grid";

const gridSpec: GridSpec = {
  kind: "grid",
  axes: "zx",
  range: [
    [0, 2],
    [-5, 5],
  ],
  divisions: [2, 2],
  snap: false,
  values: [
    [0, 1, 2],
    [-5, 0, 5],
  ],
  width: 0.5,
  color: [0.2, 0.4, 0.6, 1],
  zBias: 2,
  zIndex: 1,
};

describe("buildGrid", () => {
  test("strokes a line across the plane at each value, spanning the other axis's range", () => {
    const [line] = buildGrid(gridSpec, "oit").object
      .children as Mesh<InstancedBufferGeometry>[];
    const { geometry } = line;
    const point = (name: string, i: number) => {
      const attribute = geometry.getAttribute(name);
      return [attribute.getX(i), attribute.getY(i), attribute.getZ(i)];
    };
    const segments = Array.from({ length: geometry.instanceCount }, (_, i) => [
      point("segmentA", i),
      point("segmentB", i),
    ]);
    // [x, y, z]: values along z, then x; y is 0 throughout.
    expect(segments).toEqual([
      [
        [-5, 0, 0],
        [-5, 0, 2],
      ],
      [
        [0, 0, 0],
        [0, 0, 2],
      ],
      [
        [5, 0, 0],
        [5, 0, 2],
      ],
      [
        [-5, 0, 0],
        [5, 0, 0],
      ],
      [
        [-5, 0, 1],
        [5, 0, 1],
      ],
      [
        [-5, 0, 2],
        [5, 0, 2],
      ],
    ]);
  });

  test("strokes in the grid's style", () => {
    const [line] = buildGrid(gridSpec, "oit").object.children as Mesh[];
    const { color, width, zBias, zIndex } = line.userData.stroke;
    expect(color.toArray()).toEqual(gridSpec.color);
    expect({ width, zBias, zIndex }).toEqual({
      width: gridSpec.width,
      zBias: gridSpec.zBias,
      zIndex: gridSpec.zIndex,
    });
  });
});
