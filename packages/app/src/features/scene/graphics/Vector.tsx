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
  "components",
  "tail",
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
const Vector: GraphicComponent<MathItemType.Vector> = ({ item }) => {
  const scope = useMathScope();
  const defaultZOrder = useSelector(select.defaultGraphicOrder);
  const { color, label } = item.properties;
  const {
    components,
    tail,
    size,
    opacity,
    zIndex,
    zBias,
    labelVisible,
    start,
    end,
    zOrder = defaultZOrder[item.id],
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

  const finalVisibility = useFinalVisibility(scope, item);
  return !finalVisibility ? null : (
    <MB.Group>
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
