import React from "react";
import * as MB from "mathbox-react";
import { Controls } from "mathbox-react/threestrap";
import { MathItem, MathItemType } from "@/configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";

const props = [
  "isRotateEnabled",
  "isZoomEnabled",
  "isPanEnabled",
  "useComputed",
  "computedPosition",
  "computedTarget",
] as const;

const Camera: React.FC<{ item: MathItem<MathItemType.Camera> }> = ({
  item,
}) => {
  const scope = useMathScope();
  const { isRotateEnabled, isZoomEnabled, isPanEnabled } = useMathItemResults(
    scope,
    item,
    props
  );
  return (
    <>
      <MB.Camera proxy position={[2, 1, 0.5]} />
      <Controls
        type="orbit"
        enableRotate={isRotateEnabled}
        enablePan={isPanEnabled}
        enableZoom={isZoomEnabled}
      />
    </>
  );
};

export default Camera;
