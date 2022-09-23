import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import React, { MutableRefObject, useRef } from "react";

import Slider from "@mui/material/Slider";
import SliderControls from "./SliderControls";
import { MathAssignment, useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors, useMathResults } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Slider.module.css";
import MathValue from "../../FieldWidget/MathValue";

const config = configs[MIT.VariableSlider];

const configProps = config.properties;

const errorNames = ["value", "min", "max"] as const;
const resultNames = ["value", "min", "max"] as const;

interface SliderValues {
  min: number;
  max: number;
  value: number;
}
const initialValues: SliderValues = {
  min: -5,
  max: +5,
  value: 0,
};
const assignResultsToRef = (
  ref: MutableRefObject<Record<string, number>>,
  values: Record<string, unknown>
) => {
  Object.keys(ref.current).forEach((k) => {
    const v = values[k];
    if (typeof v === "number") {
      // eslint-disable-next-line no-param-reassign
      ref.current[k] = v;
    }
  });
};

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const results = useMathResults(mathScope, item.id, resultNames);
  const resultsRef = useRef({ ...initialValues });
  assignResultsToRef(resultsRef, results);
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
      <div className={styles.sliderRow}>
        <MathValue
          name="min"
          onChange={onWidgetChange}
          label={configProps.min.label}
          value={item.properties.min}
        />
        <Slider
          size="small"
          className={styles.slider}
          data-dndkit-no-drag
          min={resultsRef.current.min}
          max={resultsRef.current.max}
          value={resultsRef.current.value}
        />
        <MathValue
          name="max"
          onChange={onWidgetChange}
          label={configProps.max.label}
          value={item.properties.max}
        />
      </div>
    </ItemTemplate>
  );
};

export default VariableSlider;
