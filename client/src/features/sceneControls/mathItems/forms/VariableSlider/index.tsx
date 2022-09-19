import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import React from "react";

import Slider from "@mui/material/Slider";
import SliderControls from "./SliderControls";
import { MathAssignment, useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Slider.module.css";

const config = configs[MIT.VariableSlider];

const configProps = config.properties;

const errorNames = ["value"] as const;

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <div className="d-flex align-items-center justify-content-between">
        <MathAssignment
          label={configProps.value.label}
          error={errors.value}
          name="value"
          value={item.properties.value}
          onChange={onWidgetChange}
        />
        <SliderControls />
      </div>
      <div>
        <Slider size="small" className={styles.slider} data-dndkit-no-drag />
      </div>
    </ItemTemplate>
  );
};

export default VariableSlider;
