import { describe, expect, test } from "vitest";
import type { InstancedBufferGeometry, Mesh } from "three/webgpu";
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

const partsOf = (graphic: ReturnType<typeof buildSurface>) => {
  const [surface, line] = graphic.object.children as Mesh[];
  return {
    surface,
    line,
    gridlines: graphic.object.children.slice(1) as Mesh[],
    segments: () => (line.geometry as InstancedBufferGeometry).instanceCount,
  };
};

const cellTriangles = ({ samples: [cols, rows] }: SurfaceSpec) =>
  2 * (cols - 1) * (rows - 1);

describe("buildSurface", () => {
  test("draws two triangles per sample cell", () => {
    const spec = surfaceSpec();
    const { surface } = partsOf(buildSurface(spec, "oit", "glossy"));
    expect(surface.geometry.drawRange.count).toBe(3 * cellTriangles(spec));
  });

  test("strokes gridlines in the grid's style, after the surface and biased in front of it", () => {
    const spec = surfaceSpec();
    const { surface, line, gridlines, segments } = partsOf(
      buildSurface(spec, "oit", "glossy"),
    );
    gridlines.forEach((mesh) =>
      expect(mesh.renderOrder).toBeGreaterThan(surface.renderOrder),
    );
    const [cols, rows] = spec.samples;
    const [uLines, vLines] = spec.grid.lines;
    expect(segments()).toBe(uLines * (rows - 1) + vLines * (cols - 1));
    const { color, ...numbers } = line.userData.stroke;
    expect(color.toArray()).toEqual(spec.grid.color);
    expect(numbers).toMatchObject({
      width: spec.grid.width,
      zBias: spec.zBias + 5,
      zIndex: spec.zIndex,
    });
  });

  test.each([
    { width: 0 },
    { color: [0.1, 0.2, 0.3, 0] as SurfaceSpec["grid"]["color"] },
  ])("draws no gridlines with %o", (grid) => {
    const spec = surfaceSpec();
    const { line } = partsOf(
      buildSurface(
        surfaceSpec({ grid: { ...spec.grid, ...grid } }),
        "oit",
        "glossy",
      ),
    );
    expect(line.visible).toBe(false);
  });

  test("redraws in place for an updated spec", () => {
    const spec = surfaceSpec();
    const graphic = buildSurface(spec, "oit", "glossy");
    const { surface, line } = partsOf(graphic);
    const next = surfaceSpec({
      samples: [4, 3],
      grid: { ...spec.grid, width: 0 },
    });
    graphic.update(next);
    expect(partsOf(graphic).surface).toBe(surface);
    expect(surface.geometry.drawRange.count).toBe(3 * cellTriangles(next));
    expect(line.visible).toBe(false);
  });
});
