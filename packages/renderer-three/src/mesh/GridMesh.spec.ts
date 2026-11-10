import { describe, expect, test } from "vitest";
import type { BufferAttribute } from "three/webgpu";
import type { Coords, RGBA } from "@math3d/viewport-spec";
import { GridMesh } from "./GridMesh";
import { sampleGrid } from "./grid";

const opaque: RGBA = [0.2, 0.4, 0.6, 1];

const style = (color: RGBA = opaque, shaded = true) => ({
  colorAt: () => color,
  shaded,
  zBias: 3,
  zIndex: 1,
});

const grid = (cols: number, rows: number) =>
  sampleGrid([cols, rows], (u, v): Coords => [u, v, u * v]);

const positions = (mesh: GridMesh) =>
  mesh.mesh.geometry.getAttribute("position") as BufferAttribute;

describe("GridMesh", () => {
  test("refills its buffers in place while the grid fits, and draws only the grid's cells", () => {
    const surface = new GridMesh();
    surface.set(grid(10, 10), style());
    const { geometry } = surface.mesh;
    const buffer = positions(surface).array;

    surface.set(grid(4, 5), style());
    expect(surface.mesh.geometry).toBe(geometry);
    expect(positions(surface).array).toBe(buffer);
    expect(geometry.drawRange.count).toBe(6 * 3 * 4);
    // Point (1, 1) of the 4-wide grid.
    expect(Array.from(buffer.slice(15, 18))).toEqual([
      expect.closeTo(1 / 3),
      0.25,
      expect.closeTo(1 / 12),
    ]);
  });

  test("replaces its geometry when a grid outgrows it", () => {
    const surface = new GridMesh();
    surface.set(grid(4, 4), style());
    const { geometry } = surface.mesh;
    surface.set(grid(8, 8), style());
    expect(surface.mesh.geometry).not.toBe(geometry);
    expect(positions(surface).count).toBeGreaterThanOrEqual(64);
  });

  test("blends when any sample is translucent, and shares materials", () => {
    const surface = new GridMesh();
    const other = new GridMesh();
    surface.set(grid(2, 2), style([1, 0, 0, 0.5]));
    other.set(grid(2, 2), style([0, 1, 0, 0.5]));
    expect(surface.mesh.material.transparent).toBe(true);
    expect(surface.mesh.material).toBe(other.mesh.material);

    surface.set(grid(2, 2), style());
    expect(surface.mesh.material.transparent).toBe(false);
    surface.set(grid(2, 2), style(opaque, false));
    expect(surface.mesh.material).not.toBe(other.mesh.material);
  });

  test("gives the mesh its depth style, as the material reads it", () => {
    const surface = new GridMesh();
    surface.set(grid(2, 2), style());
    expect(surface.mesh.userData.mesh).toMatchObject({ zBias: 3, zIndex: 1 });
  });

  test("draws nothing for a grid without cells", () => {
    const surface = new GridMesh();
    surface.set(grid(2, 2), style());
    surface.set(grid(1, 5), style());
    expect(surface.mesh.visible).toBe(false);
  });
});
