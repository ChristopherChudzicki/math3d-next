import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import type { Emit, TensorArray } from "@use-gpu/core";
import { Sampler } from "@use-gpu/frame";
import { Line, Surface, Transpose } from "@use-gpu/plot";
import type { SurfaceSpec } from "@/features/viewport/usegpu/spec/types";
import { drawMode } from "./util";

const UNIT_RANGE: [number, number][] = [
  [0, 1],
  [0, 1],
];

export const renderSurface = (spec: SurfaceSpec): LiveElement => {
  const { position, colorAt, samples, grid } = spec;
  const emitPosition = (emit: Emit, u: number, v: number) => {
    const [x, y, z] = position(u, v);
    emit(x, y, z, 1);
  };
  const emitPositionAndColor = (emit: Emit, u: number, v: number) => {
    emitPosition(emit, u, v);
    const [r, g, b, a] = colorAt(u, v);
    emit(r, g, b, a);
  };
  const gridLine = (positions: TensorArray) =>
    use(Line, {
      positions,
      width: grid.width,
      color: grid.color,
      // Biased above the surface, as MathBox biases its gridlines.
      zBias: spec.zBias + 1,
      mode: drawMode(grid.color),
    });
  const hasGrid = grid.width > 0 && grid.color[3] > 0;
  return [
    use(Sampler, {
      axes: "xy",
      format: "vec4<f32>",
      size: samples,
      range: UNIT_RANGE,
      items: 2,
      as: ["positions", "colors"],
      expr: emitPositionAndColor,
      render: ({ positions, colors }: Record<string, TensorArray>) =>
        use(Surface, {
          positions,
          colors,
          shaded: spec.shaded,
          zBias: spec.zBias,
          mode: drawMode(spec.colorAt(0, 0)),
        }),
    }),
    // Gridlines: one coarse sampling per direction. A 2D tensor draws one
    // line per row, so each sampler is fine along one parameter and has as
    // many rows as gridlines in the other.
    hasGrid && grid.lines[1] > 0
      ? use(Sampler, {
          axes: "xy",
          format: "vec4<f32>",
          size: [samples[0], grid.lines[1]],
          range: UNIT_RANGE,
          expr: emitPosition,
          render: gridLine,
        })
      : null,
    hasGrid && grid.lines[0] > 0
      ? use(Sampler, {
          axes: "xy",
          format: "vec4<f32>",
          size: [grid.lines[0], samples[1]],
          range: UNIT_RANGE,
          expr: emitPosition,
          render: (positions: TensorArray) =>
            use(Transpose, {
              tensor: positions,
              axes: "yx",
              render: gridLine,
            }),
        })
      : null,
  ];
};
