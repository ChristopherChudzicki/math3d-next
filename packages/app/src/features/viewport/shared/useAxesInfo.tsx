import { MathItemType } from "@math3d/mathitem-configs";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import { useMemo } from "react";
import invariant from "tiny-invariant";

const axisProps = ["min", "max", "scale"] as const;

type AxesInfo = {
  range: [[number, number], [number, number], [number, number]];
  scale: [number, number, number];
};

const AXES = ["axis-x", "axis-y", "axis-z"];

/** The axes' range and scale, from the scene's three axis items. */
const useAxesInfo = (): AxesInfo => {
  const [axisX, axisY, axisZ] = useAppSelector((state) =>
    select.getItems(state, AXES),
  );
  invariant(axisX.type === MathItemType.Axis, "x is not an axis");
  invariant(axisY.type === MathItemType.Axis, "y is not an axis");
  invariant(axisZ.type === MathItemType.Axis, "z is not an axis");
  const mathScope = useMathScope();
  const xRange = useMathItemResults(mathScope, axisX, axisProps);
  const yRange = useMathItemResults(mathScope, axisY, axisProps);
  const zRange = useMathItemResults(mathScope, axisZ, axisProps);
  const range = useMemo(() => {
    const value: AxesInfo["range"] = [
      [xRange.min ?? -1, xRange.max ?? 1],
      [yRange.min ?? -1, yRange.max ?? 1],
      [zRange.min ?? -1, zRange.max ?? 1],
    ];
    return value;
  }, [xRange.min, xRange.max, yRange.min, yRange.max, zRange.min, zRange.max]);
  const scale = useMemo(() => {
    const value: AxesInfo["scale"] = [
      xRange.scale ?? 1,
      yRange.scale ?? 1,
      zRange.scale ?? 1,
    ];
    return value;
  }, [xRange.scale, yRange.scale, zRange.scale]);
  return { range, scale };
};

export default useAxesInfo;
