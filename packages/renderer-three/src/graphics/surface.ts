import { Group } from "three/webgpu";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { TriangleMesh } from "../mesh/TriangleMesh";
import {
  closedAxes,
  degenerateCurve,
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

// Added to the surface's zBias, so the curve wins over a surface it lies on.
// MathBox's gridlines take 5 outright.
const GRIDLINE_Z_BIAS = 5;

const sample = ({ samples, position }: SurfaceSpec) => {
  const grid = sampleGrid(samples, position);
  return { grid, closed: closedAxes(grid), degenerate: degenerateCurve(grid) };
};

/** Whether two specs sample the same positions. */
const samePositions = (a: SurfaceSpec, b: SurfaceSpec) =>
  a.position === b.position &&
  a.samples[0] === b.samples[0] &&
  a.samples[1] === b.samples[1];

/**
 * Parametric, explicit and polar surfaces. The surface's shader draws its
 * gridlines, so they are lit and blended with the surface under them. A
 * surface that ignores one parameter has no area to draw them on: its
 * gridlines along the other all trace one curve, drawn as a stroke.
 */
export const buildSurface = (
  spec: SurfaceSpec,
  transparency: Transparency,
  shading: Shading,
): Graphic<SurfaceSpec> => {
  const surface = new TriangleMesh(transparency, shading);
  const curve = new Stroke(transparency);
  let drawn: (ReturnType<typeof sample> & { spec: SurfaceSpec }) | null = null;
  const set = (next: SurfaceSpec) => {
    // Same positions: reuse the sampled grid and what it implies; the buffer
    // writes below are cheap next to sampling.
    const { grid, closed, degenerate } =
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
    // `lines[k]` counts lines at steps of parameter k; ignoring k, all trace
    // the curve.
    const traced = degenerate && lines[degenerate.ignored] > 0 && width > 0;
    curve.set(traced ? [degenerate.path] : [], {
      width,
      color,
      zBias: next.zBias + GRIDLINE_Z_BIAS,
      zIndex: next.zIndex,
    });
    drawn = { spec: next, grid, closed, degenerate };
  };
  set(spec);
  return {
    object: new Group().add(surface.mesh, ...curve.objects),
    update: set,
    dispose: () => {
      surface.dispose();
      curve.dispose();
    },
  };
};
