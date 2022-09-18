import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import SmallMathField from "@/util/components/SmallMathField";
import { splitAtFirstEquality } from "@/util/parsing";
import React from "react";
import ReadonlyMathField from "../../FieldWidget/ReadonlyMathField";

import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "../../FieldWidget/widget.module.css";

const config = configs[MIT.VariableSlider];

const configProps = config.properties;

const errorNames = ["min", "max", "value"] as const;

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => {
  /**
   * Display value ... number | string
   *  number => simple
   *  string => need to listen to mathscope
   * SliderValue => number
   *
   * - Update store when name changes
   *
   */

  const mathScope = useMathScope();
  const [lhs, rhs] = splitAtFirstEquality(item.properties.value);
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <div className="d-flex align-items-center">
        <SmallMathField className={styles["field-widget-input"]}>
          {lhs}
        </SmallMathField>
        <ReadonlyMathField value="=" />
        <SmallMathField className={styles["field-widget-input"]}>
          {rhs}
        </SmallMathField>
      </div>
    </ItemTemplate>
  );
};

export default VariableSlider;
