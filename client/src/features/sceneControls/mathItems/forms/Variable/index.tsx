import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import { MathEqualityInput, useOnWidgetChange } from "../../FieldWidget";
import { useMathErrors } from "../../mathScope";

const config = configs[MIT.Variable];

const errorNames = ["value"] as const;

const Variable: MathItemForm<MIT.Variable> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const errors = useMathErrors(item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <MathEqualityInput
        title="Value"
        error={errors.value}
        name="value"
        value={item.properties.value}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Variable;
