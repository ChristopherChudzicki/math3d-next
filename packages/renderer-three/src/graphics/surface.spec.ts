import { describe, expect, test, vi } from "vitest";
import type { BufferAttribute, Mesh } from "three/webgpu";
import type { Coords, SurfaceSpec } from "@math3d/viewport-spec";
import { blankColorMap } from "../mesh/colorMapTexture";
import { buildSurface } from "./surface";

const surfaceSpec = (overrides: Partial<SurfaceSpec> = {}): SurfaceSpec => ({
  kind: "surface",
  samples: [8, 6],
  position: (u, v) => [u, v, 0],
  color: { kind: "solid", rgba: [0.2, 0.4, 0.6, 1] },
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

const attributeOf = (surface: Mesh, name: string) =>
  Array.from((surface.geometry.getAttribute(name) as BufferAttribute).array);

const plane = () => vi.fn((u: number, v: number): Coords => [u, v, v]);

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

  test("tells the shader whether a map wraps, and a solid surface that it has none", () => {
    const map = (t: number): [number, number, number] => [t, 0, 1 - t];
    const color = { kind: "map", map, valueAt: () => 0.5, alpha: 1 } as const;
    const settings = (spec: SurfaceSpec) => {
      const { mapped, wrapColors, mapTexture } = meshOf(
        buildSurface(spec, "oit", "glossy"),
      ).userData.mesh;
      return { mapped, wrapColors, blank: mapTexture === blankColorMap() };
    };
    expect(settings(surfaceSpec({ color: { ...color, wrap: true } }))).toEqual({
      mapped: 1,
      wrapColors: 1,
      blank: false,
    });
    expect(settings(surfaceSpec({ color: { ...color, wrap: false } }))).toEqual(
      { mapped: 1, wrapColors: 0, blank: false },
    );
    expect(settings(surfaceSpec())).toEqual({
      mapped: 0,
      wrapColors: 0,
      blank: true,
    });
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

  test("recolors the same positions without sampling them again", () => {
    const position = plane();
    const spec = surfaceSpec({ position });
    const graphic = buildSurface(spec, "oit", "glossy");
    const surface = meshOf(graphic);
    position.mockClear();
    const positions = attributeOf(surface, "position");
    const rgba: [number, number, number, number] = [1, 0, 0, 1];
    graphic.update({
      ...spec,
      // A new array with the same counts, as each spec from the app has.
      samples: [...spec.samples],
      color: { kind: "solid", rgba },
    });
    expect(position).not.toHaveBeenCalled();
    expect(attributeOf(surface, "position")).toEqual(positions);
    expect(attributeOf(surface, "color").slice(0, 4)).toEqual(rgba);
  });

  test.each<[string, (spec: SurfaceSpec) => SurfaceSpec]>([
    [
      "position",
      (spec) => ({ ...spec, position: (u, v) => spec.position(u, v) }),
    ],
    ["samples", (spec) => ({ ...spec, samples: [5, 4] })],
  ])("samples again when %s changes", (_, change) => {
    const position = plane();
    const spec = surfaceSpec({ position });
    const graphic = buildSurface(spec, "oit", "glossy");
    position.mockClear();
    const next = change(spec);
    graphic.update(next);
    expect(position).toHaveBeenCalledTimes(next.samples[0] * next.samples[1]);
  });
});
