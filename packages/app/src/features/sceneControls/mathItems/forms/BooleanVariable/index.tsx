import React, { ChangeEvent, useCallback } from "react";
import Switch from "@mui/material/Switch";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@/configs";
import FieldWidget, { useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors, useMathItemResults } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import { OnWidgetChange } from "../../FieldWidget/types";
import style from "./boolean.module.css";

const resultNames = ["value"] as const;

const config = configs[MIT.BooleanVariable];

const Vector: MathItemForm<MIT.BooleanVariable> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const results = useMathItemResults(mathScope, item, resultNames);
  const errors = useMathErrors(mathScope, item.id, resultNames);
  const onChangeName: OnWidgetChange = useCallback(
    (e) => {
      onWidgetChange({
        name: e.name,
        value: {
          ...item.properties.value,
          lhs: e.value,
        },
      });
    },
    [item.properties.value, onWidgetChange]
  );

  const onToggle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onWidgetChange({
        name: "value",
        value: {
          ...item.properties.value,
          rhs: `${e.target.checked}`,
        },
      });
    },
    [onWidgetChange, item.properties.value]
  );

  return (
    <ItemTemplate item={item} config={config}>
      <div className={style.row}>
        <FieldWidget
          className={style["name-container"]}
          widget={WidgetType.MathValue}
          label="Switch name"
          name="value"
          error={errors.value}
          value={item.properties.value.lhs}
          onChange={onChangeName}
        />
        <div className={style["switch-container"]}>
          <Switch
            aria-label={config.properties.value.label}
            checked={!!results.value}
            onChange={onToggle}
          />
        </div>
      </div>
    </ItemTemplate>
  );
};

export default Vector;
