import { describe, expect, test } from "vitest";
import type { InstancedBufferGeometry, Mesh } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { buildSurface } from "./surface";

const surfaceSpec = (grid: Partial<SurfaceSpec["grid"]> = {}): SurfaceSpec => ({
  kind: "surface",
  samples: [8, 8],
  position: (u, v) => [u, v, 0],
  colorAt: () => [0.2, 0.4, 0.6, 1],
  shaded: true,
  grid: { lines: [3, 4], width: 2, color: [0.1, 0.2, 0.3, 0.5], ...grid },
  zBias: 2,
  zIndex: 1,
});

const parts = (spec: SurfaceSpec) => {
  const [surface, ...gridlines] = buildSurface(spec).object.children as Mesh[];
  return { surface, line: gridlines[0], gridlines };
};

describe("buildSurface", () => {
  test("draws two triangles per sample cell", () => {
    const { surface } = parts(surfaceSpec());
    expect(surface.geometry.drawRange.count).toBe(6 * 7 * 7);
  });

  test("draws the gridlines after the surface, biased in front of it, one segment per sample step", () => {
    const { surface, line, gridlines } = parts(surfaceSpec());
    gridlines.forEach((mesh) =>
      expect(mesh.renderOrder).toBeGreaterThan(surface.renderOrder),
    );
    expect((line.geometry as InstancedBufferGeometry).instanceCount).toBe(
      (3 + 4) * 7,
    );
    expect(line.userData.stroke).toMatchObject({ zBias: 2 + 5, zIndex: 1 });
  });

  test.each([
    { width: 0 },
    { color: [0.1, 0.2, 0.3, 0] as SurfaceSpec["grid"]["color"] },
  ])("draws no gridlines with %o", (grid) => {
    const { line } = parts(surfaceSpec(grid));
    expect(line.visible).toBe(false);
  });
});
