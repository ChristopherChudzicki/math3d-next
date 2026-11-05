import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { Axis } from "@use-gpu/plot";
import type { AxisSpec } from "@/features/viewport/usegpu/spec/types";
import { drawMode } from "./util";

export const renderAxis = (spec: AxisSpec): LiveElement =>
  use(Axis, {
    axis: spec.axis,
    width: spec.width,
    color: spec.color,
    start: spec.start,
    end: spec.end,
    size: spec.arrowSize,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  });
