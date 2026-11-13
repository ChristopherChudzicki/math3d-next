import { describe, expect, test } from "vitest";
import type { Coords, RGBA } from "@math3d/viewport-spec";
import {
  sampleGrid,
  writeColors,
  writeIndex,
  writeNormals,
  writeParameters,
} from "./parametricGrid";

const flat = (u: number, v: number): Coords => [u, v, 0];

const normalsOf = (position: (u: number, v: number) => Coords) => {
  const grid = sampleGrid([3, 3], position);
  const out = new Float32Array(3 * 9);
  writeNormals(grid, out);
  return Array.from({ length: 9 }, (_, k) =>
    Array.from(out.slice(3 * k, 3 * k + 3)),
  );
};

describe("sampleGrid", () => {
  test("samples [0, 1]² evenly, u fastest", () => {
    expect(sampleGrid([3, 2], flat).points).toEqual([
      [0, 0, 0],
      [0.5, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0.5, 1, 0],
      [1, 1, 0],
    ]);
  });
});

describe("writeNormals", () => {
  test("is MathBox's normal, the v step cross the u step, everywhere on a plane, far edges included", () => {
    const tilted = (u: number, v: number): Coords => [u, v, u];
    normalsOf(tilted).forEach((normal) => {
      expect(normal[0]).toBeCloseTo(Math.SQRT1_2);
      expect(normal[1]).toBeCloseTo(0);
      expect(normal[2]).toBeCloseTo(-Math.SQRT1_2);
    });
  });

  test("is zero where the steps are parallel or a neighbor is not finite", () => {
    const line = (u: number): Coords => [u, 0, 0];
    expect(normalsOf(line)).toEqual(Array(9).fill([0, 0, 0]));

    const hole = (u: number, v: number): Coords =>
      u === 0.5 && v === 0.5 ? [NaN, NaN, NaN] : [u, v, 0];
    const normals = normalsOf(hole);
    // The center and the points whose steps reach it.
    [1, 3, 4, 5, 7].forEach((k) => expect(normals[k]).toEqual([0, 0, 0]));
    expect(normals[0]).toEqual([0, 0, -1]);
  });
});

describe("writeIndex", () => {
  test("winds each triangle counterclockwise in (u, v), as MathBox does, covering each cell once", () => {
    const cols = 3;
    const rows = 3;
    const grid = sampleGrid([cols, rows], flat);
    const index = new Uint32Array(6 * cols * rows);
    const count = writeIndex(cols, rows, index);
    expect(count).toBe(6 * (cols - 1) * (rows - 1));
    let area = 0;
    for (let t = 0; t < count; t += 3) {
      const [a, b, c] = [index[t], index[t + 1], index[t + 2]].map(
        (k) => grid.points[k],
      );
      const turn =
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      expect(turn).toBeGreaterThan(0);
      area += turn / 2;
    }
    // No cell missing or covered twice.
    expect(area).toBeCloseTo(1);
  });
});

describe("writeColors", () => {
  test("writes each sample's RGBA at its parameters", () => {
    const out = new Float32Array(4 * 4);
    const colorAt = (u: number, v: number): RGBA => [u, v, 0, 1 - u];
    writeColors(sampleGrid([2, 2], flat), colorAt, out);
    expect(Array.from(out.slice(4, 8))).toEqual([1, 0, 0, 0]);
  });
});

test("writes each sample's (u, v) for the shader's gridlines", () => {
  const out = new Float32Array(12);
  writeParameters(sampleGrid([3, 2], flat), out);
  expect(Array.from(out)).toEqual([0, 0, 0.5, 0, 1, 0, 0, 1, 0.5, 1, 1, 1]);
});
