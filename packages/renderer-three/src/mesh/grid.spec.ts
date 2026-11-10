import { describe, expect, test } from "vitest";
import type { Coords, RGBA } from "@math3d/viewport-spec";
import {
  isolines,
  sampleGrid,
  writeColors,
  writeIndex,
  writeNormals,
} from "./grid";

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
  test("is the same unit normal everywhere on a plane, far edges included", () => {
    const tilted = (u: number, v: number): Coords => [u, v, u];
    normalsOf(tilted).forEach((normal) => {
      expect(normal[0]).toBeCloseTo(-Math.SQRT1_2);
      expect(normal[1]).toBeCloseTo(0);
      expect(normal[2]).toBeCloseTo(Math.SQRT1_2);
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
    expect(normals[0]).toEqual([0, 0, 1]);
  });
});

describe("writeIndex", () => {
  test("winds each triangle counterclockwise about the surface normal", () => {
    const cols = 3;
    const rows = 3;
    const grid = sampleGrid([cols, rows], flat);
    const index = new Uint32Array(6 * cols * rows);
    const count = writeIndex(cols, rows, index);
    expect(count).toBe(6 * (cols - 1) * (rows - 1));
    const normals = new Float32Array(3 * cols * rows);
    writeNormals(grid, normals);
    expect(Array.from(normals.slice(0, 3))).toEqual([0, 0, 1]);
    for (let t = 0; t < count; t += 3) {
      const [a, b, c] = [index[t], index[t + 1], index[t + 2]].map(
        (k) => grid.points[k],
      );
      const turn =
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      expect(turn).toBeGreaterThan(0);
    }
  });

  test("covers every cell with two triangles", () => {
    const index = new Uint32Array(6 * 4);
    writeIndex(2, 2, index);
    expect(new Set(index)).toEqual(new Set([0, 1, 2, 3]));
  });
});

describe("writeColors", () => {
  test("writes each sample's RGBA and reports any translucency", () => {
    const out = new Float32Array(4 * 4);
    const opaque = (u: number, v: number): RGBA => [u, v, 0, 1];
    expect(writeColors(sampleGrid([2, 2], flat), opaque, out)).toBe(false);
    expect(Array.from(out.slice(4, 8))).toEqual([1, 0, 0, 1]);

    const fading = (u: number): RGBA => [0, 0, 0, 1 - u];
    expect(writeColors(sampleGrid([2, 2], flat), fading, out)).toBe(true);
  });
});

describe("isolines", () => {
  test("runs gridlines along the sample rows and columns nearest even spacing", () => {
    const grid = sampleGrid([64, 64], flat);
    const paths = isolines(grid, [6, 2]);
    expect(paths).toHaveLength(8);
    // MathBox's resample: line k samples index round(k * 63 / 5).
    const fixedU = paths.slice(0, 6).map((path) => path[0][0] * 63);
    expect(fixedU.map(Math.round)).toEqual([0, 13, 25, 38, 50, 63]);
    paths.slice(0, 6).forEach((path) => {
      expect(path).toHaveLength(64);
      expect(new Set(path.map(([u]) => u)).size).toBe(1);
    });
    const fixedV = paths.slice(6);
    expect(fixedV.map((path) => path[0][1])).toEqual([0, 1]);
    fixedV.forEach((path) => expect(path).toHaveLength(64));
  });

  test("draws none in a direction with no lines", () => {
    expect(isolines(sampleGrid([4, 4], flat), [0, 0])).toEqual([]);
  });
});
