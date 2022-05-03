import React from "react";
import { MathItem, MathItemType as MIT } from "types";
import { assertIsMathItemType } from 'util/predicates'
import ItemTemplate from "../templates/ItemTemplate";
import { configs } from "../configs";
import { MathValue, useDispatchSetPropertyFromWidget } from "../FieldWidget";

type Props = {
  item: MathItem;
};
const Variable: React.FC<Props> = ({ item }) => {
  assertIsMathItemType(item.type, MIT.Variable)
  const dispatchSetProperty = useDispatchSetPropertyFromWidget(item);
  return (
    <ItemTemplate item={item} config={configs[MIT.Variable]}>
      <MathValue
        name="name"
        style={{width:'50px'}}
        value={item.properties.name}
        onChange={dispatchSetProperty}
      />
      =
      <MathValue
        name="value"
        value={item.properties.value}
        onChange={dispatchSetProperty}
      />
    </ItemTemplate>
  );
};

export default Variable;
