import type { AxesRange, Coords } from "@math3d/viewport-spec";

/**
 * The affine map from math coordinates to view coordinates, per axis:
 * `view = math * scale + offset` takes `range` onto `[-viewScale, viewScale]`.
 * A zero-width range spans `[min, min + 1]`, as MathBox's cartesian view does.
 */
export const mathToView = (
  range: AxesRange,
  viewScale: Coords,
): { scale: Coords; offset: Coords } => {
  const scale = range.map(
    ([min, max], i) => (2 * viewScale[i]) / (max - min || 1),
  ) as Coords;
  const offset = range.map(
    ([min], i) => -min * scale[i] - viewScale[i],
  ) as Coords;
  return { scale, offset };
};
