import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import type { TensorArray } from "@use-gpu/core";
import { Axis, Scale, Tick } from "@use-gpu/plot";
import type { Coords } from "@/features/viewport/shared/coordinates";
import type { AxisSpec } from "@math3d/viewport-spec";
import { formatTick } from "./format";
import { drawMode } from "./util";
import { CssPixelLabel, LABEL_STYLE, renderLabels } from "./labels";

const axisEnd = (axis: AxisSpec["axis"], max: number): Coords => {
  if (axis === "x") return [max, 0, 0];
  if (axis === "y") return [0, max, 0];
  return [0, 0, max];
};

/** MathBox's tick-label offsets: 20px below, or 20px right on z. */
const tickLabelOffset = (axis: AxisSpec["axis"]): [number, number] =>
  axis === "z" ? [20, 0] : [0, 20];

/** MathBox's 30px above the axis end. */
const AXIS_LABEL_OFFSET: [number, number] = [0, -30];

const renderTicks = (spec: AxisSpec): LiveElement =>
  spec.ticks.visible
    ? use(Scale, {
        axis: spec.axis,
        divide: spec.ticks.divisions,
        zero: false,
        range: spec.range,
        render: ({
          positions,
          values,
        }: {
          positions: TensorArray;
          values: TensorArray;
        }) => [
          use(Tick, {
            positions,
            size: 10,
            width: 2,
            color: spec.color,
            depth: 1,
            offset: spec.axis === "y" ? [1, 0, 0] : [0, 1, 0],
            zBias: spec.zBias,
            mode: drawMode(spec.color),
          }),
          use(CssPixelLabel, {
            positions,
            values,
            formatter: formatTick,
            placement: "center",
            offset: tickLabelOffset(spec.axis),
            zBias: spec.zBias,
            zIndex: spec.zIndex,
            ...LABEL_STYLE,
          }),
        ],
      })
    : null;

const renderAxisLabel = (spec: AxisSpec): LiveElement =>
  spec.label === null
    ? null
    : renderLabels(
        [axisEnd(spec.axis, spec.range[1])],
        spec.label,
        AXIS_LABEL_OFFSET,
        spec,
      );

export const renderAxis = (spec: AxisSpec): LiveElement => [
  use(Axis, {
    axis: spec.axis,
    width: spec.width,
    color: spec.color,
    start: spec.start,
    end: spec.end,
    size: spec.arrowSize,
    depth: 1,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  }),
  renderTicks(spec),
  renderAxisLabel(spec),
];
