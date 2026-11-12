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
  const width = range.map(([min, max]) => max - min || 1);
  const scale = width.map((w, i) => (2 * viewScale[i]) / w) as Coords;
  const offset = range.map(
    ([min], i) => -(min + width[i] / 2) * scale[i],
  ) as Coords;
  return { scale, offset };
};
