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
} from "../mesh/parametricGrid";
import type { ParametricGrid } from "../mesh/parametricGrid";
import { Stroke } from "../stroke/Stroke";
import type { Shading } from "../mesh/meshMaterial";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

// Like MathBox's own surface wireframe (zBias + lineBias); the app's MathBox
// renderer pins gridlines at 5 instead.
const GRIDLINE_Z_BIAS = 5;

const fillSurface = (
  mesh: TriangleMesh,
  grid: ParametricGrid,
  spec: SurfaceSpec,
) => {
  const { cols, rows } = grid;
  mesh.fill(cols * rows, 6 * (cols - 1) * (rows - 1), spec, (out) => {
    writePositions(grid, out.position);
    if (spec.shaded) writeNormals(grid, out.normal);
    writeIndex(cols, rows, out.index);
    writeColors(grid, spec.colorAt, out.color);
  });
};

/** Parametric, explicit and polar surfaces, with their gridlines. */
export const buildSurface = (
  spec: SurfaceSpec,
  transparency: Transparency,
  shading: Shading,
): Graphic<SurfaceSpec> => {
  const surface = new TriangleMesh(transparency, shading);
  const gridlines = new Stroke(transparency);
  gridlines.objects.forEach((mesh) => {
    // After the surface, within the item's group.
    // eslint-disable-next-line no-param-reassign
    mesh.renderOrder = 1;
  });
  const set = (next: SurfaceSpec) => {
    const grid = sampleGrid(next.samples, next.position);
    fillSurface(surface, grid, next);
    const { lines, width, color } = next.grid;
    gridlines.set(width > 0 ? isolines(grid, lines) : [], {
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
