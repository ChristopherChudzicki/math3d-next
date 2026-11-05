import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { Point } from "@use-gpu/plot";
import type { PointSpec } from "@/features/viewport/usegpu/graphicSpec/types";
import { drawMode } from "./util";
import { withItemLabel } from "./labels";

export const renderPoint = (spec: PointSpec): LiveElement =>
  withItemLabel(
    use(Point, {
      positions: spec.positions,
      size: spec.size,
      color: spec.color,
      zBias: spec.zBias,
      zIndex: spec.zIndex,
      mode: drawMode(spec.color),
    }),
    spec.positions,
    spec.label,
    spec,
  );
