import React from "react";
import { MathItem, MathItemType as MIT } from "types";
import { assertIsMathItemType } from "util/predicates";
import ItemTemplate from "../../templates/ItemTemplate";
import { configs } from "../../configs";
import { MathEqualityInput, useOnWidgetChange } from "../../FieldWidget";
import { useMathErrors } from "../../mathScope";

const config = configs[MIT.Variable];

const errorNames = ["value"] as const;

type Props = {
  item: MathItem;
};
const Variable: React.FC<Props> = ({ item }) => {
  assertIsMathItemType(item.type, MIT.Variable);
  const onWidgetChange = useOnWidgetChange(item);
  const errors = useMathErrors(item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <MathEqualityInput
        error={errors.value}
        name="value"
        value={item.properties.value}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Variable;
