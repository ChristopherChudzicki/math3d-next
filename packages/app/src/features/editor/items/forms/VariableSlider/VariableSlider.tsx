import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import React, { useState, useCallback, useMemo } from "react";

import Slider from "@/ui/Slider";
import { ParseableObjs } from "@math3d/parser";
import FieldWidget, {
  MathAssignment,
  useOnWidgetChange,
} from "@/features/editor/items/FieldWidget";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useMathErrors,
  useMathResults,
} from "@/store/scene/evaluation/mathScope";
import ItemTemplate from "@/features/editor/items/templates/ItemTemplate";
import { MathItemForm } from "@/features/editor/items/forms/interfaces";
import {
  OnWidgetChange,
  WidgetChangeEvent,
} from "@/features/editor/items/FieldWidget/types";
import type { SliderControlsProps } from "./SliderControls";
import SliderControls, { mustFindSpeed } from "./SliderControls";
import {
  getSliderParameters,
  sliderNumbers,
  valueAssignment,
} from "./sliderMath";
import styles from "./slider.module.css";

const config = configs[MIT.VariableSlider];
const configProps = config.properties;

const errorNames = ["value", "range", "fps"] as const;
const resultNames = [
  "duration",
  "value",
  "range",
  "fps",
  "isAnimating",
] as const;

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const { lhs, rhs } = item.properties.value;
  // The value displays rounded unless it's exactly what the user typed.
  const [typedRhs, setTypedRhs] = useState<string | null>(null);

  const speed = mustFindSpeed(item.properties.speedMultiplier);

  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const results = useMathResults(mathScope, item.id, resultNames);
  const isAnimating = !!results.isAnimating;
  const { fps, min, max, value, duration } = sliderNumbers(results);

  const onAnimationChange = useCallback(
    (animating: boolean) => {
      onWidgetChange({ name: "isAnimating", value: `${animating}` });
    },
    [onWidgetChange],
  );
  const onValueChange = useCallback(
    (v: number) => {
      onWidgetChange({ name: "value", value: valueAssignment(lhs, v) });
    },
    [onWidgetChange, lhs],
  );
  const onManualChange: OnWidgetChange<ParseableObjs["assignment"]> =
    useCallback(
      (e) => {
        if (e.oldValue?.rhs !== e.value.rhs) {
          setTypedRhs(e.value.rhs);
        }
        onWidgetChange(e);
      },
      [onWidgetChange],
    );
  const onSpeedChange: SliderControlsProps["onSpeedChange"] = useCallback(
    (nextSpeed) => {
      onWidgetChange({ name: "speedMultiplier", value: nextSpeed.value });
    },
    [onWidgetChange],
  );
  const { baseIncrement } = getSliderParameters(min, max, fps, duration);
  const onStep: SliderControlsProps["onStep"] = useCallback(
    (step) => onValueChange(value + baseIncrement * step),
    [value, baseIncrement, onValueChange],
  );
  const { range } = item.properties;
  const onSetRange = useMemo(() => {
    const setMinMax = (e: WidgetChangeEvent<string>, i: number) => {
      const items = [...range.items];
      items[i] = e.value;
      const event: WidgetChangeEvent<ParseableObjs["array"]> = {
        name: "range",
        value: { type: "array", items },
      };
      onWidgetChange(event);
    };
    return {
      min: (e: WidgetChangeEvent<string>) => setMinMax(e, 0),
      max: (e: WidgetChangeEvent<string>) => setMinMax(e, 1),
    };
  }, [range, onWidgetChange]);
  const rangeErrors: { min?: Error; max?: Error } = useMemo(() => {
    if (!errors.range) return {};
    if (errors.range instanceof AggregateError) {
      return {
        min: errors.range.errors[0],
        max: errors.range.errors[1],
      };
    }
    return { min: errors.range, max: errors.range };
  }, [errors.range]);
  return (
    <ItemTemplate item={item} config={config}>
      <div className={styles.controlsRow}>
        <MathAssignment
          label={configProps.value.label}
          error={errors.value}
          lhsClassName={styles.displayValueLhs}
          rhsClassName={styles.displayValueRhs}
          separatorClassName={styles.separator}
          name="value"
          value={item.properties.value}
          onChange={onManualChange}
          numDecimalDigits={rhs === typedRhs ? undefined : 2}
        />
        <SliderControls
          className={styles.sliderControls}
          speed={speed}
          onSpeedChange={onSpeedChange}
          isAnimating={isAnimating}
          onAnimationChange={onAnimationChange}
          onStep={onStep}
        />
      </div>
      <div className={styles.sliderRow}>
        <FieldWidget
          widget={WidgetType.MathValue}
          name="min"
          error={rangeErrors.min}
          onChange={onSetRange.min}
          label="Min"
          value={item.properties.range.items[0] as string}
        />
        <Slider
          aria-label={configProps.value.label}
          data-dndkit-no-drag
          onValueChange={onValueChange}
          step={baseIncrement}
          largeStep={(max - min) / 10}
          min={min}
          max={max}
          value={value}
        />
        <FieldWidget
          widget={WidgetType.MathValue}
          name="max"
          error={rangeErrors.max}
          onChange={onSetRange.max}
          label="Max"
          value={item.properties.range.items[1] as string}
        />
      </div>
    </ItemTemplate>
  );
};

export default VariableSlider;
