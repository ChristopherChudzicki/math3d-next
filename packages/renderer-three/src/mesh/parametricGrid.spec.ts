import { describe, expect, test } from "vitest";
import type { Coords } from "@math3d/viewport-spec";
import {
  closedAxes,
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
    value: new Float32Array(vertices),
  });

  test("writes a solid color to every vertex", () => {
    const out = buffers(4);
    writeColors(
      sampleGrid([2, 2], flat),
      { kind: "solid", rgba: [0.1, 0.2, 0.3, 0.4] },
      out,
    );
    expect(Array.from(out.color.slice(12, 16))).toEqual(
      Array.from(new Float32Array([0.1, 0.2, 0.3, 0.4])),
    );
  });

  test("writes a map's value at each sample, and its alpha", () => {
    const out = buffers(4);
    writeColors(
      sampleGrid([2, 2], (u, v) => [u, v, 3]),
      {
        kind: "map",
        map: () => [1, 1, 1],
        valueAt: (u, v, [, , z]) => z + u - v,
        wrap: false,
        alpha: 0.5,
      },
      out,
    );
    expect(Array.from(out.value)).toEqual([3, 4, 2, 3]);
    expect(Array.from(out.color.slice(4, 8))).toEqual([0, 0, 0, 0.5]);
  });

  test("writes a value past float32's range as its end, and a non-finite one as 0", () => {
    const out = buffers(4);
    const values = [NaN, Infinity, 1e39, -1e39];
    writeColors(
      sampleGrid([2, 2], flat),
      {
        kind: "map",
        map: () => [0, 0, 0],
        valueAt: (u, v) => values[2 * v + u],
        wrap: false,
        alpha: 1,
      },
      out,
    );
    const max = 3.4028234663852886e38;
    expect(Array.from(out.value)).toEqual([0, 0, max, -max]);
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
