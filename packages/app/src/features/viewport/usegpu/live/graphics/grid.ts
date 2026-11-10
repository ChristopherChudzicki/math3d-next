import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { Grid } from "@use-gpu/plot";
import type { GridSpec } from "@math3d/viewport-spec";
import { drawMode } from "./util";

export const renderGrid = (spec: GridSpec): LiveElement =>
  use(Grid, {
    axes: spec.axes,
    first: { divide: spec.divisions[0], nice: spec.snap },
    second: { divide: spec.divisions[1], nice: spec.snap },
    width: spec.width,
    depth: 1,
    color: spec.color,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  });
