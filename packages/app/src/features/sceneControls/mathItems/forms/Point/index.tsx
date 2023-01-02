import React from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@/configs";
import FieldWidget, { useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const errorNames = ["coords"] as const;

const config = configs[MIT.Point];

const configProps = config.properties;

const Point: MathItemForm<MIT.Point> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <FieldWidget
        widget={WidgetType.MathValue}
        label={configProps.coords.label}
        name="coords"
        error={errors.coords}
        value={item.properties.coords}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Point;
