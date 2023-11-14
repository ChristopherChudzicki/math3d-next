import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import { useMathScope } from "@/features/sceneControls/mathItems/mathItemsSlice";
import { useMathItemResults } from "@/features/sceneControls/mathItems/mathScope";
import { useMemo } from "react";
import invariant from "tiny-invariant";

const axisProps = ["min", "max", "scale"] as const;

type AxesInfo = {
  range: [[number, number], [number, number], [number, number]];
  scale: [number, number, number];
};

const useAxesInfo = (
  axisX: MathItem,
  axisY: MathItem,
  axisZ: MathItem,
): AxesInfo => {
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
