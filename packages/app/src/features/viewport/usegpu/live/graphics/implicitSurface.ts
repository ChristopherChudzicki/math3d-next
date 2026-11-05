import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import type { Emit, TensorArray } from "@use-gpu/core";
import { Sampler } from "@use-gpu/frame";
import { ImplicitSurface } from "@use-gpu/plot";
import type { ImplicitSurfaceSpec } from "@/features/viewport/usegpu/graphicSpec/types";
import { drawMode } from "./util";

export const renderImplicitSurface = (
  spec: ImplicitSurfaceSpec,
): LiveElement => {
  const { value, domain, samples } = spec;
  const size = [samples, samples, samples];
  // Sample one cell beyond the domain; the layer then scissors the surface at
  // the domain edge, so a surface crossing it is cut cleanly rather than
  // ending a cell short.
  const padding = 1;
  // Finite-difference step: half a grid cell per axis.
  const h = domain.map(([lo, hi]) => (hi - lo) / samples / 2);
  const emitValue = (emit: Emit, x: number, y: number, z: number) => {
    emit(value(x, y, z));
  };
  const emitNormal = (emit: Emit, x: number, y: number, z: number) => {
    const nx = value(x + h[0], y, z) - value(x - h[0], y, z);
    const ny = value(x, y + h[1], z) - value(x, y - h[1], z);
    const nz = value(x, y, z + h[2]) - value(x, y, z - h[2]);
    const len = Math.hypot(nx, ny, nz) || 1;
    emit(nx / len, ny / len, nz / len, 0);
  };
  return use(Sampler, {
    axes: "xyz",
    format: "f32",
    size,
    range: domain,
    padding,
    expr: emitValue,
    render: (values: TensorArray) =>
      use(Sampler, {
        axes: "xyz",
        format: "vec4<f32>",
        size,
        range: domain,
        padding,
        expr: emitNormal,
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
