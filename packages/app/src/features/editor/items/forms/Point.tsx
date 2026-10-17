import React from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import * as u from "@/util/styles/utils.module.css";
import FieldWidget, {
  useOnWidgetChange,
} from "@/features/editor/items/FieldWidget";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathErrors } from "@/store/scene/evaluation/mathScope";
import ItemTemplate from "@/features/editor/items/templates/ItemTemplate";
import { MathItemForm } from "./interfaces";

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
        className={u.dBlock}
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
