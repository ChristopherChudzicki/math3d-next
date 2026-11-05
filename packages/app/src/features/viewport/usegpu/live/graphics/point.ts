import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { Point } from "@use-gpu/plot";
import type { PointSpec } from "@/features/viewport/usegpu/spec/types";
import { drawMode } from "./util";

export const renderPoint = (spec: PointSpec): LiveElement =>
  use(Point, {
    positions: spec.positions,
    size: spec.size,
    color: spec.color,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  });
