import { describe, expect, test, vi } from "vitest";
import type { Coords, RGBA } from "@math3d/viewport-spec";
import {
  closedAxes,
  hasNoArea,
  isolines,
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
  const buffers = (vertices: number) => ({
    color: new Float32Array(4 * vertices),
    mapValue: new Float32Array(2 * vertices),
  });
  test("writes each sample's RGBA, from its parameters and its sampled point", () => {
    const out = buffers(4);
    const grid = sampleGrid([2, 2], (u, v) => [10 * u, 10 * v, 0]);
    const colorAt = (u: number, v: number, [x, y]: Coords): RGBA => [
      u,
      v,
      x,
      y,
    ];
    writeColors(grid, { colorAt }, [false, false], out);
    expect(Array.from(out.color.slice(4, 8))).toEqual([1, 0, 10, 0]);
  });

  test("with a periodic color, writes each value as a point on the unit circle, and its alpha", () => {
    const out = buffers(4);
    // By vertex: a quarter turn, a half turn, a hair below 0, and no value.
    const values = [0.25, 0.5, -1e-13, NaN];
    const mapColor = {
      map: (): [number, number, number] => [1, 1, 1],
      valueAt: (u: number, v: number, [x, y]: Coords) => values[2 * y + x],
      alpha: 0.5,
      periodic: true,
    };
    const colorAt = vi.fn((): RGBA => [1, 1, 1, 1]);
    writeColors(
      sampleGrid([2, 2], flat),
      { colorAt, mapColor },
      [false, false],
      out,
    );
    const expected = [0, 1, -1, 0, 1, 0, 0, 0];
    Array.from(out.mapValue).forEach((c, k) =>
      expect(c).toBeCloseTo(expected[k]),
    );
    // Exactly 0, so the vertex sits on the seam's low side.
    expect(out.mapValue[5]).toBe(0);
    expect(out.color[7]).toBe(0.5);
    // The value is the color expression; `colorAt` would evaluate it again.
    expect(colorAt).not.toHaveBeenCalled();
  });

  test("with a color that doesn't wrap, writes each value's map and alpha, and each value and weight", () => {
    const out = buffers(4);
    // A change of 0.75 across the cell, over the blend threshold.
    const mapColor = {
      map: (t: number): [number, number, number] => [t, 0, 1 - t],
      valueAt: (u: number) => 0.75 * u,
      alpha: 0.5,
      periodic: false,
    };
    const colorAt = vi.fn((): RGBA => [1, 1, 1, 1]);
    writeColors(
      sampleGrid([2, 2], flat),
      { colorAt, mapColor },
      [false, false],
      out,
    );
    expect(Array.from(out.color.slice(4, 8))).toEqual([0.75, 0, 0.25, 0.5]);
    expect(Array.from(out.mapValue.slice(0, 4))).toEqual([0, 1, 0.75, 1]);
    expect(colorAt).not.toHaveBeenCalled();
  });
});

test("writes each sample's (u, v) for the shader's gridlines", () => {
  const out = new Float32Array(12);
  writeParameters(sampleGrid([3, 2], flat), out);
  expect(Array.from(out)).toEqual([0, 0, 0.5, 0, 1, 0, 0, 1, 0.5, 1, 1, 1]);
});

test("finds which axes close on themselves", () => {
  const turn = (t: number) => 2 * Math.PI * t;
  const torus = (u: number, v: number): Coords => [
    (2 + Math.cos(turn(v))) * Math.cos(turn(u)),
    (2 + Math.cos(turn(v))) * Math.sin(turn(u)),
    Math.sin(turn(v)),
  ];
  const cylinder = (u: number, v: number): Coords => [
    Math.cos(turn(u)),
    Math.sin(turn(u)),
    v,
  ];
  expect(closedAxes(sampleGrid([16, 8], torus))).toEqual([true, true]);
  expect(closedAxes(sampleGrid([16, 8], cylinder))).toEqual([true, false]);
  expect(closedAxes(sampleGrid([16, 8], flat))).toEqual([false, false]);
});

describe("hasNoArea", () => {
  const circle = (u: number, v: number): Coords => [
    Math.cos(u + v),
    Math.sin(u + v),
    0,
  ];

  test("holds for a surface that ignores a parameter, or is a function of u + v at equal steps", () => {
    const ignoresU = (_u: number, v: number): Coords => [v, v * v, 1];
    expect(hasNoArea(sampleGrid([4, 3], ignoresU))).toBe(true);
    expect(hasNoArea(sampleGrid([8, 8], circle))).toBe(true);
  });

  test("counts a cell with an undefined corner as having no area", () => {
    const withHole = (_u: number, v: number): Coords =>
      v === 0.5 ? [NaN, NaN, NaN] : [v, v * v, 1];
    expect(hasNoArea(sampleGrid([4, 3], withHole))).toBe(true);
  });

  test("fails for a surface with area, though one row collapses", () => {
    const cone = (u: number, v: number): Coords => [u * v, v, 0];
    expect(hasNoArea(sampleGrid([3, 3], cone))).toBe(false);
  });

  // A limit, not a goal: the tolerance covers rounding only, so a sliver
  // keeps its faint shader lines. Counting slivers as having no area would be
  // an improvement; change this case with it.
  test("fails for a sliver: a function of u + v at unequal steps", () => {
    expect(hasNoArea(sampleGrid([8, 6], circle))).toBe(false);
  });

  test("fails for a strip of any width, however narrow", () => {
    const strip = (u: number, v: number): Coords => [u, 1e-9 * v, 0];
    expect(hasNoArea(sampleGrid([3, 3], strip))).toBe(false);
  });
});

describe("isolines", () => {
  test("runs gridlines along the sample rows and columns nearest even spacing", () => {
    const grid = sampleGrid([64, 32], flat);
    const paths = isolines(grid, [6, 2]);
    expect(paths).toHaveLength(8);
    // MathBox's resample: line k samples index round(k * 63 / 5).
    const uIndices = paths.slice(0, 6).map((path) => path[0][0] * 63);
    expect(uIndices.map(Math.round)).toEqual([0, 13, 25, 38, 50, 63]);
    paths.slice(0, 6).forEach((path) => {
      expect(path).toHaveLength(32);
      expect(new Set(path.map(([u]) => u)).size).toBe(1);
    });
    const vPaths = paths.slice(6);
    expect(vPaths.map((path) => path[0][1])).toEqual([0, 1]);
    vPaths.forEach((path) => expect(path).toHaveLength(64));
  });

  test("runs at most one line per sample", () => {
    const grid = sampleGrid([4, 3], flat);
    expect(isolines(grid, [Infinity, 100])).toHaveLength(4 + 3);
  });
});
