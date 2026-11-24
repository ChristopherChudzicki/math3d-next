import { Group } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { TriangleMesh } from "../mesh/TriangleMesh";
import {
  closedAxes,
  hasNoArea,
  isolines,
  sampleGrid,
  writeColors,
  writeIndex,
  writeNormals,
  writeParameters,
  writePositions,
} from "../mesh/parametricGrid";
import type { Shading } from "../mesh/meshMaterial";
import { Stroke } from "../stroke/Stroke";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

// Added to the surface's zBias, so the lines win over another surface they
// lie on. MathBox's gridlines take 5 outright.
const GRIDLINE_Z_BIAS = 5;

const sample = ({ samples, position, positions }: SurfaceSpec) => {
  const grid = sampleGrid(samples, position, positions);
  return { grid, closed: closedAxes(grid), noArea: hasNoArea(grid) };
};

/** Whether two specs sample the same positions. */
const samePositions = (a: SurfaceSpec, b: SurfaceSpec) =>
  a.position === b.position &&
  a.samples[0] === b.samples[0] &&
  a.samples[1] === b.samples[1];

/**
 * Parametric, explicit and polar surfaces. The surface's shader draws its
 * gridlines, so they are lit and blended with the surface under them. A
 * surface with no area (one that ignores a parameter, say) has no pixels to
 * draw them on, so it strokes them, as MathBox does.
 */
export const buildSurface = (
  spec: SurfaceSpec,
  transparency: Transparency,
  shading: Shading,
): Graphic<SurfaceSpec> => {
  const surface = new TriangleMesh(transparency, shading);
  const gridlines = new Stroke(transparency);
  let drawn: (ReturnType<typeof sample> & { spec: SurfaceSpec }) | null = null;
  const set = (next: SurfaceSpec) => {
    // Same positions: reuse the sampled grid and what it implies; the buffer
    // writes below are cheap next to sampling.
    const { grid, closed, noArea } =
      drawn && samePositions(drawn.spec, next) ? drawn : sample(next);
    const { cols, rows } = grid;
    const style = { ...next, gridClosed: closed };
    surface.fill(cols * rows, 6 * (cols - 1) * (rows - 1), style, (out) => {
      writePositions(grid, out.position);
      if (next.shaded) writeNormals(grid, out.normal);
      writeIndex(cols, rows, out.index);
      writeColors(grid, next, closed, out);
      writeParameters(grid, out.parameter);
    });
    const { lines, width, color } = next.grid;
    gridlines.set(noArea && width > 0 ? isolines(grid, lines) : [], {
      width,
      color,
      zBias: next.zBias + GRIDLINE_Z_BIAS,
      zIndex: next.zIndex,
    });
    drawn = { spec: next, grid, closed, noArea };
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
