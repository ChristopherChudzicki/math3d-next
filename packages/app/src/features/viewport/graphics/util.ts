import type { AxesRange, Coords } from "./interfaces";

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

export { project };
