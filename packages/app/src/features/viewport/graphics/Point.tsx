import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useDefaultGraphicOrder } from "@/store/scene/evaluation/useDefaultGraphicOrder";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import { GraphicComponent } from "./interfaces";

const props = [
  "color",
  "opacity",
  "zIndex",
  "zBias",
  "zOrder",
  "labelVisible",
  "coords",
  "size",
] as const;
const labelOffset = [0, 40, 0];
const Point: GraphicComponent<MathItemType.Point> = ({ item }) => {
  const scope = useMathScope();
  const defaultZOrder = useDefaultGraphicOrder();
  const { color, label } = item.properties;
  const {
    coords,
    size,
    opacity,
    zIndex,
    zBias,
    zOrder = defaultZOrder[item.id],
    labelVisible,
  } = useMathItemResults(scope, item, props);
  const labels = useMemo(() => {
    return Array(coords?.length ?? 0).fill(label);
  }, [coords, label]);
  const finalVisibility = useFinalVisibility(scope, item);
  return !finalVisibility ? null : (
    <MB.Group>
      <MB.Array data={coords} items={1} channels={3} />
      <MB.Point
        size={size}
        color={color}
        opacity={opacity}
        zIndex={zIndex}
        zBias={zBias}
        zOrder={zOrder}
      />
      {labelVisible && (
        <MB.Group>
          <MB.Format weight="bold" data={labels} />
          <MB.Label offset={labelOffset} zOrder={zOrder} />
        </MB.Group>
      )}
    </MB.Group>
  );
};

export default Point;
