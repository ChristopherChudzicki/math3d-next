import React from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import FieldWidget, { useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const errorNames = ["coords"] as const;

const config = configs[MIT.Vector];

const configProps = config.properties;

const Vector: MathItemForm<MIT.Vector> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <FieldWidget
        widget={WidgetType.MathValue}
        label={configProps.components.label}
        name="coords"
        error={errors.coords}
        value={item.properties.components}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Vector;
