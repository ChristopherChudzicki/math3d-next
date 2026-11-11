import { describe, expect, test } from "vitest";
import type { AxesRange } from "@math3d/viewport-spec";
import { marchingCubes } from "./marchingCubes";
import type { IsoMesh } from "./marchingCubes";
import { sampleScalarGrid } from "./scalarGrid";

type Field = (x: number, y: number, z: number) => number;

const box = (half: number): AxesRange => [
  [-half, half],
  [-half, half],
  [-half, half],
];

const CENTER = [0.3, -0.2, 0.1];
/** A sphere about `CENTER`, positive outside. */
const sphere =
  (radius: number): Field =>
  (x, y, z) =>
    (x - CENTER[0]) ** 2 +
    (y - CENTER[1]) ** 2 +
    (z - CENTER[2]) ** 2 -
    radius ** 2;

const meshOf = (cells: number, domain: AxesRange, field: Field) =>
  marchingCubes(sampleScalarGrid(cells, domain, field));

const vertices = ({ vertexCount, position, normal }: IsoMesh) =>
  Array.from({ length: vertexCount }, (_, v) => ({
    position: Array.from(position.subarray(3 * v, 3 * v + 3)),
    normal: Array.from(normal.subarray(3 * v, 3 * v + 3)),
  }));

const triangles = ({ indexCount, index }: IsoMesh) =>
  Array.from({ length: indexCount / 3 }, (_, t) =>
    Array.from(index.subarray(3 * t, 3 * t + 3)),
  );

/** The triangle edges, as "from>to", that no triangle runs the other way. */
const unmatchedEdges = (mesh: IsoMesh) => {
  const edges = new Map<string, number>();
  triangles(mesh).forEach((corners) =>
    corners.forEach((from, k) => {
      const key = `${from}>${corners[(k + 1) % 3]}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }),
  );
  return [...edges.keys()].filter((key) => {
    const [from, to] = key.split(">");
    return edges.get(key) !== edges.get(`${to}>${from}`);
  });
};

const radial = (position: number[]) => {
  const offset = position.map((value, axis) => value - CENTER[axis]);
  const length = Math.hypot(...offset);
  return { length, direction: offset.map((value) => value / length) };
};

const dot = (a: number[], b: number[]) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe("marchingCubes", () => {
  // Cells of different widths per axis, and a sphere off the grid's center.
  const domain: AxesRange = [
    [-4, 4],
    [-3, 3],
    [-5, 5],
  ];

  test("puts a sphere's vertices on its radius, with radial normals", () => {
    const mesh = meshOf(24, domain, sphere(2.5));
    expect(mesh.vertexCount).toBeGreaterThan(500);
    vertices(mesh).forEach(({ position, normal }) => {
      const { length, direction } = radial(position);
      expect(length).toBeCloseTo(2.5, 1);
      expect(dot(normal, direction)).toBeGreaterThan(0.999);
    });
  });

  test("shares vertices between cells, closing a surface inside the grid", () => {
    const mesh = meshOf(24, domain, sphere(2.5));
    // A closed triangle mesh has half as many vertices as triangles, plus 2.
    expect(mesh.vertexCount).toBe(mesh.indexCount / 6 + 2);
    expect(unmatchedEdges(mesh)).toEqual([]);
  });

  test("winds triangles counterclockwise seen from the positive side", () => {
    const mesh = meshOf(24, domain, sphere(2.5));
    const at = vertices(mesh).map(({ position }) => position);
    triangles(mesh).forEach(([a, b, c]) => {
      const ab = at[b].map((value, axis) => value - at[a][axis]);
      const ac = at[c].map((value, axis) => value - at[a][axis]);
      const facing = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
      expect(dot(facing, radial(at[a]).direction)).toBeGreaterThan(0);
    });
  });

  test("ends a surface that leaves the grid on the grid's faces", () => {
    const mesh = meshOf(16, box(2), (x, y, z) => x * x + y * y - z * z - 1);
    const at = vertices(mesh).map(({ position }) => position);
    const open = unmatchedEdges(mesh);
    expect(open.length).toBeGreaterThan(0);
    open.forEach((edge) => {
      const [from, to] = edge.split(">").map(Number);
      const onSharedFace = [0, 1, 2].some(
        (axis) =>
          Math.abs(at[from][axis]) === 2 && at[from][axis] === at[to][axis],
      );
      expect(onSharedFace).toBe(true);
    });
  });

  test("leaves no hole where the field is zero at grid points", () => {
    // Radius 2 about the origin passes through grid points, (2, 0, 0) among them.
    const mesh = meshOf(8, box(4), (x, y, z) => x * x + y * y + z * z - 4);
    expect(mesh.indexCount).toBeGreaterThan(0);
    expect(unmatchedEdges(mesh)).toEqual([]);
  });

  test("is closed whatever the cells' corner signs", () => {
    // Noise covers the cases a smooth surface never produces.
    let seed = 1;
    const noise = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296 - 0.5;
    };
    const inside = (x: number, y: number, z: number) =>
      Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) < 0.9;
    const mesh = meshOf(12, box(1), (x, y, z) =>
      inside(x, y, z) ? noise() : -1,
    );
    expect(mesh.indexCount).toBeGreaterThan(3000);
    expect(unmatchedEdges(mesh)).toEqual([]);
  });

  test.each([NaN, Infinity])(
    "draws no triangle in a cell with a %s corner",
    (hole) => {
      // A plane at z = 0.1 with the field undefined along the column x, y > 1.
      const mesh = meshOf(8, box(2), (x, y, z) =>
        x > 1 && y > 1 ? hole : z - 0.1,
      );
      const at = vertices(mesh).map(({ position }) => position);
      expect(mesh.indexCount).toBeGreaterThan(0);
      triangles(mesh).forEach((corners) =>
        corners.forEach((corner) => {
          const [x, y, z] = at[corner];
          expect(z).toBeCloseTo(0.1);
          expect(x <= 1 || y <= 1).toBe(true);
        }),
      );
    },
  );

  test("gives a zero normal where the gradient is not finite", () => {
    // A zero-width axis has no gradient along it.
    const flat: AxesRange = [
      [-1, 1],
      [-1, 1],
      [0, 0],
    ];
    const mesh = meshOf(2, flat, (x) => x - 0.5);
    expect(mesh.vertexCount).toBeGreaterThan(0);
    vertices(mesh).forEach(({ normal }) => expect(normal).toEqual([0, 0, 0]));
  });
});
