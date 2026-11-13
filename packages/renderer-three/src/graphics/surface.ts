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
import type { Shading } from "../mesh/meshMaterial";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

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
  const set = (next: SurfaceSpec) => {
    const grid = sampleGrid(next.samples, next.position);
    const { cols, rows } = grid;
    const style = { ...next, gridClosed: closedAxes(grid) };
    surface.fill(cols * rows, 6 * (cols - 1) * (rows - 1), style, (out) => {
      writePositions(grid, out.position);
      if (next.shaded) writeNormals(grid, out.normal);
      writeIndex(cols, rows, out.index);
      writeColors(grid, next.colorAt, out.color);
      writeParameters(grid, out.parameter);
    });
  };
  set(spec);
  return {
    object: new Group().add(surface.mesh),
    update: set,
    dispose: () => surface.dispose(),
  };
};
