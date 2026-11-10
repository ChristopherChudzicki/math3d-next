import { Group } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { GridMesh } from "../mesh/GridMesh";
import { isolines, sampleGrid } from "../mesh/grid";
import { Stroke } from "../stroke/Stroke";
import type { Graphic } from "./builders";

// MathBox draws a surface's gridlines with zBias 5, which keeps them in
// front of the surface they lie on.
const GRIDLINE_Z_BIAS = 5;

/** Parametric, explicit and polar surfaces, with their gridlines. */
export const buildSurface = (spec: SurfaceSpec): Graphic<SurfaceSpec> => {
  const surface = new GridMesh();
  const gridlines = new Stroke();
  gridlines.objects.forEach((mesh) => {
    // Within the item, after the surface.
    // eslint-disable-next-line no-param-reassign
    mesh.renderOrder = 1;
  });
  const set = (next: SurfaceSpec) => {
    const grid = sampleGrid(next.samples, next.position);
    surface.set(grid, next);
    const { lines, width, color } = next.grid;
    // MathBox hides a line with no opacity rather than drawing it.
    const hasGrid = width > 0 && color[3] > 0;
    gridlines.set(hasGrid ? isolines(grid, lines) : [], {
      width,
      color,
      zBias: next.zBias + GRIDLINE_Z_BIAS,
      zIndex: next.zIndex,
    });
  };
  set(spec);
  return {
    object: new Group().add(surface.mesh, ...gridlines.objects),
    update: set,
    dispose: () => {
      surface.dispose();
      gridlines.dispose();
    },
  };
};
