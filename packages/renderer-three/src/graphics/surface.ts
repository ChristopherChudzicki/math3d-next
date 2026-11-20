import { Group } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { TriangleMesh } from "../mesh/TriangleMesh";
import {
  closedAxes,
  sampleGrid,
  writeColors,
  writeIndex,
  writeNormals,
  writeParameters,
  writePositions,
} from "../mesh/parametricGrid";
import type { ParametricGrid } from "../mesh/parametricGrid";
import type { Shading } from "../mesh/meshMaterial";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

/** Whether two specs sample the same positions. */
const samePositions = (a: SurfaceSpec, b: SurfaceSpec) =>
  a.position === b.position &&
  a.samples[0] === b.samples[0] &&
  a.samples[1] === b.samples[1];

/**
 * Parametric, explicit and polar surfaces. The surface's shader draws its
 * gridlines, so they are lit and blended with the surface under them.
 */
export const buildSurface = (
  spec: SurfaceSpec,
  transparency: Transparency,
  shading: Shading,
): Graphic<SurfaceSpec> => {
  const surface = new TriangleMesh(transparency, shading);
  let drawn: {
    spec: SurfaceSpec;
    grid: ParametricGrid;
    closed: [boolean, boolean];
  } | null = null;
  const set = (next: SurfaceSpec) => {
    // Same positions: reuse the sampled grid and its closed axes; the buffer
    // writes below are cheap next to sampling.
    const reuse = drawn && samePositions(drawn.spec, next) ? drawn : null;
    const grid = reuse?.grid ?? sampleGrid(next.samples, next.position);
    const closed = reuse?.closed ?? closedAxes(grid);
    const { cols, rows } = grid;
    const style = { ...next, gridClosed: closed };
    surface.fill(cols * rows, 6 * (cols - 1) * (rows - 1), style, (out) => {
      writePositions(grid, out.position);
      if (next.shaded) writeNormals(grid, out.normal);
      writeIndex(cols, rows, out.index);
      writeColors(grid, next, closed, out);
      writeParameters(grid, out.parameter);
    });
    drawn = { spec: next, grid, closed };
  };
  set(spec);
  return {
    object: new Group().add(surface.mesh),
    update: set,
    dispose: () => surface.dispose(),
  };
};
