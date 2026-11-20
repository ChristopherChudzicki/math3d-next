import { describe, expect, test, vi } from "vitest";
import type { BufferAttribute, Mesh } from "three/webgpu";
import type { Coords, SurfaceSpec } from "@math3d/viewport-spec";
import { colorMapTexture } from "../mesh/colorMapTexture";
import { meshMaterial } from "../mesh/meshMaterial";
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

  test("a surface draws through its map color, periodic or mapped, and by vertex color once it has none", () => {
    const map = (t: number): [number, number, number] => [t, 0, 1 - t];
    const mapColor = { map, valueAt: () => 0.5, alpha: 1, periodic: true };
    const graphic = buildSurface(surfaceSpec({ mapColor }), "oit", "glossy");
    const surface = meshOf(graphic);
    expect(surface.material).toBe(
      meshMaterial(true, "opaque", "oit", "glossy", "periodic"),
    );
    expect(surface.userData.mesh.mapTexture).toBe(colorMapTexture(map));

    graphic.update(surfaceSpec({ mapColor: { ...mapColor, periodic: false } }));
    expect(surface.material).toBe(
      meshMaterial(true, "opaque", "oit", "glossy", "mapped"),
    );
    expect(surface.userData.mesh.mapTexture).toBe(colorMapTexture(map));
    expect(attributeOf(surface, "color").slice(0, 4)).toEqual([0.5, 0, 0.5, 1]);

    graphic.update(surfaceSpec());
    expect(surface.material).toBe(
      meshMaterial(true, "opaque", "oit", "glossy", "vertex"),
    );
    expect(attributeOf(surface, "color").slice(0, 4)).toEqual(
      Array.from(new Float32Array([0.2, 0.4, 0.6, 1])),
    );
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
      colorAt: () => rgba,
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
