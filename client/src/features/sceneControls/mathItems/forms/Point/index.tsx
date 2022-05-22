import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import { MathValue, useOnWidgetChange } from "../../FieldWidget";
import { useMathErrors } from "../../mathScope";

const errorNames = ["coords"] as const;

const config = configs[MIT.Point];

const configProps = config.properties;

const Point: MathItemForm<MIT.Point> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const errors = useMathErrors(item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <MathValue
        title={configProps.coords.label}
        name="name"
        error={errors.coords}
        value={item.properties.coords}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Point;
