import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { Arrow, Line } from "@use-gpu/plot";
import type { LineSpec } from "@/features/viewport/usegpu/graphicSpec/types";
import { drawMode } from "./util";
import { withItemLabel } from "./labels";

const renderPath = (spec: LineSpec): LiveElement => {
  const common = {
    positions: spec.paths,
    width: spec.width,
    color: spec.color,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  };
  return spec.start || spec.end
    ? use(Arrow, {
        ...common,
        start: spec.start,
        end: spec.end,
        size: spec.arrowSize,
      })
    : use(Line, common);
};

export const renderLine = (spec: LineSpec): LiveElement => {
  const last = spec.paths.at(-1)?.at(-1);
  return withItemLabel(
    renderPath(spec),
    last ? [last] : [],
    spec.label,
    spec.zBias,
  );
};
