import React from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import {
  useFinalVisibility,
  useMathItemResults,
} from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/sceneSlice";
import { GraphicComponent } from "./interfaces";

const props = [
  "divisions",
  "opacity",
  "width",
  "zBias",
  "zIndex",
  "snap",
] as const;

const Grid: GraphicComponent<MathItemType.Grid> = ({ item, zOrder }) => {
  const scope = useMathScope();
  const { color, axes } = item.properties;
  const { divisions, opacity, width, zIndex, zBias, snap } = useMathItemResults(
    scope,
    item,
    props,
  );
  const finalVisibility = useFinalVisibility(scope, item);
  return !finalVisibility ? null : (
    <MB.Grid
      axes={axes}
      color={color}
      width={width}
      divideX={divisions?.[0]}
      divideY={divisions?.[1]}
      opacity={opacity}
      zIndex={zIndex}
      zBias={zBias}
      zOrder={zOrder}
      niceX={snap}
      niceY={snap}
    />
  );
};

export default Grid;
