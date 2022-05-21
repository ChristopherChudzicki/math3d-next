import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import { MathValue, useOnWidgetChange } from "../../FieldWidget";
import { useMathErrors } from "../../mathScope";

const errorNames = ["coords"] as const;

const Point: MathItemForm<MIT.Point> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const errors = useMathErrors(item.id, errorNames);
  return (
    <ItemTemplate item={item} config={configs[MIT.Point]}>
      <MathValue
        name="coords"
        error={errors.coords}
        value={item.properties.coords}
        onChange={onWidgetChange}
      />
    </ItemTemplate>
  );
};

export default Point;
