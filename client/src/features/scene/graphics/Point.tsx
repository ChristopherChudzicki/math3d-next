import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItem, MathItemType } from "@/configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";

const props = [
  "color",
  "visible",
  "opacity",
  "zIndex",
  "zBias",
  "labelVisible",
  "coords",
  "size",
] as const;
const labelOffset = [0, 40, 0];
const Point: React.FC<{ item: MathItem<MathItemType.Point> }> = ({ item }) => {
  const scope = useMathScope();
  const { color, label } = item.properties;
  const { coords, size, visible, opacity, zIndex, zBias, labelVisible } =
    useMathItemResults(scope, item, props);
  const labels = useMemo(() => {
    return Array(coords?.length ?? 0).fill(label);
  }, [coords, label]);
  return (
    <MB.Group visible={visible}>
      <MB.Array data={coords} items={1} channels={3} />
      <MB.Point
        size={size}
        color={color}
        opacity={opacity}
        zIndex={zIndex}
        zBias={zBias}
      />
      {labelVisible && (
        <MB.Group>
          <MB.Format weight="bold" data={labels} />
          <MB.Label offset={labelOffset} />
        </MB.Group>
      )}
    </MB.Group>
  );
};

export default Point;
