import React from "react";
import * as MB from "mathbox-react";
import { MathItem, MathItemType } from "@/configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";

const props = [
  "divisions",
  "opacity",
  "visible",
  "width",
  "zBias",
  "zIndex",
  "snap",
] as const;

const Grid: React.FC<{ item: MathItem<MathItemType.Grid> }> = ({ item }) => {
  const scope = useMathScope();
  const { color, axes } = item.properties;
  const { divisions, visible, opacity, width, zIndex, zBias, snap } =
    useMathItemResults(scope, item, props);
  return !visible ? null : (
    <MB.Grid
      axes={axes}
      color={color}
      width={width}
      divideX={divisions?.[0]}
      divideY={divisions?.[1]}
      opacity={opacity}
      visible={visible}
      zIndex={zIndex}
      zBias={zBias}
      niceX={snap}
      niceY={snap}
    />
  );
};

export default Grid;
