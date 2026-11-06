import { use, useMemo } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { toTensorArray } from "@use-gpu/core";
import type { Emit, TensorArray } from "@use-gpu/core";
import { Sampler } from "@use-gpu/frame";
import { ImplicitSurface } from "@use-gpu/plot";
import type { ImplicitSurfaceSpec } from "@/features/viewport/usegpu/graphicSpec/types";
import {
  MAX_IMPLICIT_SAMPLES,
  gradientFromGrid,
} from "@/features/viewport/usegpu/implicitGrid";
import { drawMode } from "./util";

type Vec3 = [number, number, number];

type ImplicitNormalsProps = {
  values: TensorArray;
  spacing: Vec3;
  render: (normals: TensorArray) => LiveElement;
};

/** Normals for a sampled `f32` field, from finite differences of the grid itself. */
const ImplicitNormals = ({ values, spacing, render }: ImplicitNormalsProps) => {
  // `spacing` is a fresh array every render, so memoize on its entries.
  const [sx, sy, sz] = spacing;
  const normals = useMemo(() => {
    const size = Array.from(values.size) as Vec3;
    const grid = gradientFromGrid(values.array as Float32Array, size, [
      sx,
      sy,
      sz,
    ]);
    return toTensorArray("vec4<f32>", grid, size);
  }, [values, sx, sy, sz]);
  return render(normals);
};

export const renderImplicitSurface = (
  spec: ImplicitSurfaceSpec,
): LiveElement => {
  const { value, domain } = spec;
  // Like MathBox, `samples` counts cells per axis, so n + 1 points.
  const n = Math.min(spec.samples, MAX_IMPLICIT_SAMPLES);
  const size = [n + 1, n + 1, n + 1];
  // Sample one cell beyond the domain; the layer then scissors the surface at
  // the domain edge, so a surface crossing it is cut cleanly rather than
  // ending a cell short.
  const padding = 1;
  // Sampler places its points from lo to hi inclusive; padding extends the
  // grid outward at the same step.
  const spacing = domain.map(([lo, hi]) => (hi - lo) / n) as Vec3;
  const emitValue = (emit: Emit, x: number, y: number, z: number) => {
    emit(value(x, y, z));
  };
  return use(Sampler, {
    axes: "xyz",
    format: "f32",
    size,
    range: domain,
    padding,
    expr: emitValue,
    render: (values: TensorArray) =>
      use(ImplicitNormals, {
        values,
        spacing,
        render: (normals: TensorArray) =>
          use(ImplicitSurface, {
            values,
            normals,
            range: domain,
            padding,
            level: 0,
            method: "linear",
            shaded: spec.shaded,
            color: spec.color,
            zBias: spec.zBias,
            mode: drawMode(spec.color),
          }),
      }),
  });
};
