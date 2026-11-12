import type { AxesRange, Coords } from "@math3d/viewport-spec";

/** A zero-width range spans one unit, as in MathBox. */
const width = ([min, max]: [number, number]) => max - min || 1;

/**
 * Project a coordinate from one linear range to another
 */
const project = (
  position1: Coords,
  range1: AxesRange,
  range2: AxesRange,
): Coords =>
  position1.map(
    (p, i) =>
      range2[i][0] + ((p - range1[i][0]) / width(range1[i])) * width(range2[i]),
  ) as Coords;

const cartesianRange = (scale: Coords): AxesRange => [
  [-scale[0], scale[0]],
  [-scale[1], scale[1]],
  [-scale[2], scale[2]],
];

/**
 * Converts a camera coordinate, as the camera item stores it, to cartesian
 * coordinates, where the axes' range spans [-scale, scale]. With
 * `useRelative`, the stored coordinate is a fraction of `scale`.
 */
const fromUi = (
  pos: Coords,
  range: AxesRange,
  scale: Coords,
  useRelative: boolean,
): Coords => {
  if (useRelative) return pos.map((p, i) => p * scale[i]) as Coords;
  return project(pos, range, cartesianRange(scale));
};

/** The inverse of `fromUi`. */
const toUi = (
  pos: Coords,
  range: AxesRange,
  scale: Coords,
  useRelative: boolean,
): Coords => {
  if (useRelative) return pos.map((p, i) => p / scale[i]) as Coords;
  return project(pos, cartesianRange(scale), range);
};

export { fromUi, toUi };
