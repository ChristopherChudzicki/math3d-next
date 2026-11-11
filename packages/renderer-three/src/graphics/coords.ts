import type { Coords } from "@math3d/viewport-spec";

const AXIS_INDEX = { x: 0, y: 1, z: 2 } as const;

export type AxisName = keyof typeof AXIS_INDEX;

/** The point with `values` on `axes`, in order, and 0 on the rest. */
export const pointOn = (
  axes: readonly AxisName[],
  values: readonly number[],
): Coords => {
  const point: Coords = [0, 0, 0];
  axes.forEach((axis, i) => {
    point[AXIS_INDEX[axis]] = values[i];
  });
  return point;
};
