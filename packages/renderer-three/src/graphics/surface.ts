import { Group } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { TriangleMesh } from "../mesh/TriangleMesh";
import {
  isolines,
  sampleGrid,
  writeColors,
  writeIndex,
  writeNormals,
  writePositions,
} from "../mesh/grid";
import type { Grid } from "../mesh/grid";
import { Stroke } from "../stroke/Stroke";
import type { Graphic } from "./builders";

// MathBox gives gridlines a fixed zBias 5; offsetting the surface's own
// keeps them in front of it whatever it is.
const GRIDLINE_Z_BIAS = 5;

const fillSurface = (mesh: TriangleMesh, grid: Grid, spec: SurfaceSpec) => {
  const { cols, rows } = grid;
  const cells = cols > 1 && rows > 1 ? (cols - 1) * (rows - 1) : 0;
  mesh.fill(cols * rows, 6 * cells, spec, (out) => {
    writePositions(grid, out.position);
    if (spec.shaded) writeNormals(grid, out.normal);
    if (cells > 0) writeIndex(cols, rows, out.index);
    return writeColors(grid, spec.colorAt, out.color);
  });
};

/** Parametric, explicit and polar surfaces, with their gridlines. */
export const buildSurface = (spec: SurfaceSpec): Graphic<SurfaceSpec> => {
  const surface = new TriangleMesh();
  const gridlines = new Stroke();
  gridlines.objects.forEach((mesh) => {
    // After the surface, within the item's group.
    // eslint-disable-next-line no-param-reassign
    mesh.renderOrder = 1;
  });
  const set = (next: SurfaceSpec) => {
    const grid = sampleGrid(next.samples, next.position);
    fillSurface(surface, grid, next);
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
