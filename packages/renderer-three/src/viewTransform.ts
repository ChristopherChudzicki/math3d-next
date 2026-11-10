import type { AxesRange, Coords } from "@math3d/viewport-spec";

/**
 * The affine map from math coordinates to view coordinates, per axis:
 * `view = math * scale + offset` takes `range` onto `[-viewScale, viewScale]`.
 */
export const mathToView = (
  range: AxesRange,
  viewScale: Coords,
): { scale: Coords; offset: Coords } => {
  const scale = range.map(
    ([min, max], i) => (2 * viewScale[i]) / (max - min),
  ) as Coords;
  const offset = range.map(
    ([min, max], i) => (-(min + max) / 2) * scale[i],
  ) as Coords;
  return { scale, offset };
};
