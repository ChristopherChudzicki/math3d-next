import React from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import FieldWidget, {
  useOnWidgetChange,
} from "@/features/editor/items/FieldWidget";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathErrors } from "@/store/scene/evaluation/mathScope";
import ItemTemplate from "@/features/editor/items/templates/ItemTemplate";
import ReadonlyMathField from "@/features/editor/items/FieldWidget/ReadonlyMathField";
import { MathItemForm } from "./interfaces";
import styles from "./Axis.module.css";

const errorNames = ["axis", "min", "max", "scale"] as const;
const mainRow = ["min", "max", "scale"] as const;

const config = configs[MIT.Axis];

const configProps = config.properties;

const Axis: MathItemForm<MIT.Axis> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <div className={styles.row}>
        <div className={styles.labeledGroup}>
          <span className={styles.label}>{configProps.axis.label}</span>
          <ReadonlyMathField value={item.properties.axis} />
        </div>
        {mainRow.map((name) => (
          <div key={name} className={styles.labeledGroup}>
            <span className={styles.label}>{configProps[name].label}</span>
            <FieldWidget
              widget={WidgetType.MathValue}
              label={configProps[name].label}
              name={name}
              error={errors[name]}
              value={item.properties[name]}
              onChange={onWidgetChange}
            />
          </div>
        ))}
      </div>
    </ItemTemplate>
  );
};

export default Axis;
