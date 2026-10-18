import React, { useCallback } from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import Switch from "@/ui/Switch";
import FieldWidget, {
  useOnWidgetChange,
} from "@/features/editor/items/FieldWidget";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useMathErrors,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import ItemTemplate from "@/features/editor/items/templates/ItemTemplate";
import { OnWidgetChange } from "@/features/editor/items/FieldWidget/types";
import { MathItemForm } from "./interfaces";
import style from "./BooleanVariable.module.css";

const resultNames = ["value"] as const;

const config = configs[MIT.BooleanVariable];

const Vector: MathItemForm<MIT.BooleanVariable> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const results = useMathItemResults(mathScope, item, resultNames);
  const errors = useMathErrors(mathScope, item.id, resultNames);
  const onChangeName: OnWidgetChange<string> = useCallback(
    (e) => {
      onWidgetChange({
        name: e.name,
        value: {
          ...item.properties.value,
          lhs: e.value,
        },
      });
    },
    [item.properties.value, onWidgetChange],
  );

  const onToggle = useCallback(
    (checked: boolean) => {
      onWidgetChange({
        name: "value",
        value: {
          ...item.properties.value,
          rhs: `${checked}`,
        },
      });
    },
    [onWidgetChange, item.properties.value],
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
            onCheckedChange={onToggle}
          />
        </div>
      </div>
    </ItemTemplate>
  );
};

export default Vector;
