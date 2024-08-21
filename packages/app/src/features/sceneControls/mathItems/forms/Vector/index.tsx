import React from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import * as u from "@/util/styles/utils.module.css";
import FieldWidget, { useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../sceneSlice";
import { useMathErrors } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const errorNames = ["components"] as const;

const config = configs[MIT.Vector];

const configProps = config.properties;

const Vector: MathItemForm<MIT.Vector> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <FieldWidget
        className={u.dBlock}
        widget={WidgetType.MathValue}
        label={configProps.components.label}
        name="components"
        error={errors.components}
        value={item.properties.components}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Vector;
