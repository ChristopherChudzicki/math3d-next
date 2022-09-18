import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import React from "react";

import { MathAssignment, useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const config = configs[MIT.Variable];

const configProps = config.properties;

const errorNames = ["value"] as const;

const Variable: MathItemForm<MIT.Variable> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <MathAssignment
        label={configProps.value.label}
        error={errors.value}
        name="value"
        value={item.properties.value}
        onChange={onWidgetChange}
        rhsClassName="flex-1"
      />
    </ItemTemplate>
  );
};

export default Variable;
