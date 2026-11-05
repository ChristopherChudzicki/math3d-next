type Coords = [number, number, number];
type AxesRange = [[number, number], [number, number], [number, number]];

/**
 * Project a coordinate from one linear range to another
 */
const project = (
  position1: Coords,
  range1: AxesRange,
  range2: AxesRange,
): Coords => {
  const [x1, y1, z1] = position1;
  const [[xMin1, xMax1], [yMin1, yMax1], [zMin1, zMax1]] = range1;
  const [[xMin2, xMax2], [yMin2, yMax2], [zMin2, zMax2]] = range2;
  const x2 = xMin2 + ((x1 - xMin1) / (xMax1 - xMin1)) * (xMax2 - xMin2);
  const y2 = yMin2 + ((y1 - yMin1) / (yMax1 - yMin1)) * (yMax2 - yMin2);
  const z2 = zMin2 + ((z1 - zMin1) / (zMax1 - zMin1)) * (zMax2 - zMin2);
  return [x2, y2, z2];
};

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

export { project, fromUi, toUi };
export type { Coords, AxesRange };
