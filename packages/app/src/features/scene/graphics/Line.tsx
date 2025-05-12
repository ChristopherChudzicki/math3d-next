import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import { useSelector } from "react-redux";
import { select, useMathScope } from "../../sceneControls/mathItems/sceneSlice";
import {
  useFinalVisibility,
  useMathItemResults,
} from "../../sceneControls/mathItems/mathScope";
import { GraphicComponent } from "./interfaces";

const props = [
  "coords",
  "labelVisible",
  "opacity",
  "size",
  "width",
  "zBias",
  "zIndex",
  "zOrder",
  "start",
  "end",
] as const;

const labelOffset = [0, 40, 0];
const Line: GraphicComponent<MathItemType.Line> = ({ item }) => {
  const scope = useMathScope();
  const defaultZOrder = useSelector(select.defaultGraphicOrder);
  const { color, label } = item.properties;
  const {
    coords,
    size,
    opacity,
    zIndex,
    zBias,
    zOrder = defaultZOrder[item.id],
    labelVisible,
    start,
    end,
    width,
  } = useMathItemResults(scope, item, props);
  const finalVisibility = useFinalVisibility(scope, item);
  const labelCoords = useMemo(() => {
    const last = coords?.at(-1);
    return last ? [last] : undefined;
  }, [coords]);
  const labels = useMemo(() => {
    return [label];
  }, [label]);
  return !finalVisibility ? null : (
    <MB.Group>
      <MB.Array data={coords} items={1} channels={3} />
      <MB.Line
        size={size}
        color={color}
        opacity={opacity}
        zIndex={zIndex}
        zBias={zBias}
        zOrder={zOrder}
        start={start}
        end={end}
        width={width}
      />
      {labelVisible && labelCoords && (
        <MB.Group>
          <MB.Array data={labelCoords} items={1} channels={3} />
          <MB.Format weight="bold" data={labels} />
          <MB.Label offset={labelOffset} />
        </MB.Group>
      )}
    </MB.Group>
  );
};

export default Line;
