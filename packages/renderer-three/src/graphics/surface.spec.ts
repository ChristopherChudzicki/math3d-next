import { describe, expect, test } from "vitest";
import type { Mesh } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { buildSurface } from "./surface";

const surfaceSpec = (overrides: Partial<SurfaceSpec> = {}): SurfaceSpec => ({
  kind: "surface",
  samples: [8, 6],
  position: (u, v) => [u, v, 0],
  colorAt: () => [0.2, 0.4, 0.6, 1],
  shaded: true,
  grid: { lines: [3, 4], width: 2, color: [0.1, 0.2, 0.3, 0.5] },
  zBias: 2,
  zIndex: 1,
  ...overrides,
});

const meshOf = (graphic: ReturnType<typeof buildSurface>) => {
  const [surface, ...rest] = graphic.object.children as Mesh[];
  expect(rest).toHaveLength(0);
  return surface;
};

const gridOf = (surface: Mesh) => {
  const { gridLines, gridWidth, gridOpacity } = surface.userData.mesh;
  return { lines: gridLines.toArray(), width: gridWidth, opacity: gridOpacity };
};

const cellTriangles = ({ samples: [cols, rows] }: SurfaceSpec) =>
  2 * (cols - 1) * (rows - 1);

describe("buildSurface", () => {
  test("draws two triangles per sample cell", () => {
    const spec = surfaceSpec();
    const surface = meshOf(buildSurface(spec, "oit", "glossy"));
    expect(surface.geometry.drawRange.count).toBe(3 * cellTriangles(spec));
  });

  test("gives the surface's shader the grid's lines, width and opacity", () => {
    const spec = surfaceSpec();
    const surface = meshOf(buildSurface(spec, "oit", "glossy"));
    expect(gridOf(surface)).toEqual({
      lines: spec.grid.lines,
      width: spec.grid.width,
      opacity: spec.grid.color[3],
    });
  });

  test("tells the shader which axes close on themselves", () => {
    const tube = surfaceSpec({
      position: (u, v) => [
        Math.cos(2 * Math.PI * u),
        Math.sin(2 * Math.PI * u),
        v,
      ],
    });
    const surface = meshOf(buildSurface(tube, "oit", "glossy"));
    expect(surface.userData.mesh.gridClosed.toArray()).toEqual([1, 0]);
  });

  test("redraws in place for an updated spec, with no gridlines at width 0", () => {
    const spec = surfaceSpec();
    const graphic = buildSurface(spec, "oit", "glossy");
    const surface = meshOf(graphic);
    const next = surfaceSpec({
      samples: [4, 3],
      grid: { ...spec.grid, width: 0 },
    });
    graphic.update(next);
    expect(meshOf(graphic)).toBe(surface);
    expect(surface.geometry.drawRange.count).toBe(3 * cellTriangles(next));
    expect(gridOf(surface).lines).toEqual([0, 0]);
  });
});
