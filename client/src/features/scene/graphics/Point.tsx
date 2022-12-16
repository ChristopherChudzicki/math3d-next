import React from "react";
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
  "label",
  "labelVisible",
  "coords",
  "size",
] as const;
const Point: React.FC<{ item: MathItem<MathItemType.Point> }> = ({ item }) => {
  const scope = useMathScope();
  const { color } = item.properties;
  const { coords, size, visible, opacity, zIndex, zBias, label, labelVisible } =
    useMathItemResults(scope, item, props);
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
    </MB.Group>
  );
};

export default Point;
