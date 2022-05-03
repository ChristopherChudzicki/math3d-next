import React from "react";
import { MathItem, MathItemType as MIT } from "types";
import { assertIsMathItemType } from 'util/predicates'
import ItemTemplate from "../templates/ItemTemplate";
import { configs } from "../configs";
import { MathValue, useDispatchSetPropertyFromWidget } from "../FieldWidget";

type Props = {
  item: MathItem;
};
const Point: React.FC<Props> = ({ item }) => {
  assertIsMathItemType(item.type, MIT.Point)
  const dispatchSetProperty = useDispatchSetPropertyFromWidget(item);
  return (
    <ItemTemplate item={item} config={configs[MIT.Point]}>
      <MathValue
        name="coords"
        value={item.properties.coords}
        onChange={dispatchSetProperty}
      />
    </ItemTemplate>
  );
};

export default Point;
