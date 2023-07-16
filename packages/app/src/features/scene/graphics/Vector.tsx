import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";
import { GraphicComponent } from "./interfaces";

const props = [
  "components",
  "tail",
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
const Vector: GraphicComponent<MathItemType.Vector> = ({ item, zOrder }) => {
  const scope = useMathScope();
  const { color, label } = item.properties;
  const {
    components,
    tail,
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
  const coords = useMemo(() => {
    if (!components || !tail) return undefined;
    const head = components.map((c, i) => c + tail[i]);
    return [tail, head];
  }, [components, tail]);
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
        zOrder={zOrder}
      />
      {labelVisible && labelCoords && (
        <MB.Group>
          <MB.Array data={labelCoords} items={1} channels={3} />
          <MB.Format weight="bold" data={labels} />
          <MB.Label offset={labelOffset} zOrder={zOrder} />
        </MB.Group>
      )}
    </MB.Group>
  );
};

export default Vector;
