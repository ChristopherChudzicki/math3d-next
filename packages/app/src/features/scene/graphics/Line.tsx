import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";
import { GraphicComponent } from "./interfaces";

const props = [
  "coords",
  "labelVisible",
  "opacity",
  "visible",
  "size",
  "width",
  "zBias",
  "zIndex",
  "start",
  "end",
] as const;

const labelOffset = [0, 40, 0];
const Line: GraphicComponent<MathItemType.Line> = ({ item }) => {
  const scope = useMathScope();
  const { color, label } = item.properties;
  const {
    coords,
    size,
    visible,
    opacity,
    zIndex,
    zBias,
    labelVisible,
    start,
    end,
    width,
  } = useMathItemResults(scope, item, props);
  const labelCoords = useMemo(() => {
    const last = coords?.at(-1);
    return last ? [last] : undefined;
  }, [coords]);
  const labels = useMemo(() => {
    return [label];
  }, [label]);
  return (
    <MB.Group visible={visible}>
      <MB.Array data={coords} items={1} channels={3} />
      <MB.Line
        size={size}
        color={color}
        opacity={opacity}
        zIndex={zIndex}
        zBias={zBias}
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
