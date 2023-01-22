import { MathItem, MathItemType } from "@/configs";
import { useMathScope } from "@/features/sceneControls/mathItems/mathItemsSlice";
import { useMathItemResults } from "@/features/sceneControls/mathItems/mathScope";
import { Cartesian, Camera } from "mathbox-react";
import React, { useMemo } from "react";
import invariant from "tiny-invariant";

const axisProps = ["min", "max", "scale"] as const;

interface SceneCartesianProps {
  children: React.ReactNode;
  axisX: MathItem;
  axisY: MathItem;
  axisZ: MathItem;
}
const SceneCartesian: React.FC<SceneCartesianProps> = ({
  axisX,
  axisY,
  axisZ,
  children,
}) => {
  invariant(axisX.type === MathItemType.Axis, "x is not an axis");
  invariant(axisY.type === MathItemType.Axis, "y is not an axis");
  invariant(axisZ.type === MathItemType.Axis, "z is not an axis");
  const mathScope = useMathScope();
  const xRange = useMathItemResults(mathScope, axisX, axisProps);
  const yRange = useMathItemResults(mathScope, axisY, axisProps);
  const zRange = useMathItemResults(mathScope, axisZ, axisProps);
  const range = useMemo(
    () => [
      [xRange.min ?? -1, xRange.max ?? 1],
      [yRange.min ?? -1, yRange.max ?? 1],
      [zRange.min ?? -1, zRange.max ?? 1],
    ],
    [xRange.min, xRange.max, yRange.min, yRange.max, zRange.min, zRange.max]
  );
  const scale = useMemo(
    () => [xRange.scale ?? 1, yRange.scale ?? 1, zRange.scale ?? 1],
    [xRange.scale, yRange.scale, zRange.scale]
  );
  return (
    <Cartesian range={range} scale={scale}>
      <Camera proxy position={[2, 1, 0.5]} />
      {children}
    </Cartesian>
  );
};

export default SceneCartesian;
