import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@/configs";
import React, { useRef, useState, useEffect, useCallback } from "react";

import Slider from "@mui/material/Slider";
import { useInterval } from "@/util/hooks/useInterval";
import classNames from "classnames";
import { splitAtFirstEquality } from "@/util/parsing";
import SliderControls, { mustFindSpeed } from "./SliderControls";
import type { SliderControlsProps } from "./SliderControls";
import FieldWidget, {
  MathAssignment,
  useOnWidgetChange,
} from "../../FieldWidget";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors, useMathResults } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Slider.module.css";
import { OnWidgetChange } from "../../FieldWidget/types";

const config = configs[MIT.VariableSlider];
const configProps = config.properties;

const errorNames = ["value", "min", "max"] as const;
const resultNames = ["duration", "value", "min", "max", "isAnimating"] as const;

interface AnimatedSliderProps {
  fps: number;
  duration: number;
  isAnimating: boolean;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

const trueMod = (x: number, modulus: number) => {
  const y = x % modulus;
  return y < 0 ? y + modulus : y;
};

const wrap = (x: number, min: number, max: number) =>
  min + trueMod(x - min, max - min);

const getSliderParameters = (
  min: number,
  max: number,
  fps: number,
  duration: number
) => {
  const frames = fps * duration;
  const ms = (1 / fps) * 1000;
  const range = max - min;
  const increment = range / frames;
  return { increment, ms };
};

const AnimatedSlider: React.FC<AnimatedSliderProps> = ({
  onChange,
  min,
  max,
  fps,
  duration,
  value,
  isAnimating,
}) => {
  const valueRef = useRef(value);
  valueRef.current = value;
  const { increment, ms } = getSliderParameters(min, max, fps, duration);

  const tick = useCallback(() => {
    valueRef.current = wrap(valueRef.current + increment, min, max);
    onChange(valueRef.current);
  }, [increment, onChange, min, max]);

  useInterval(tick, isAnimating ? ms : null);

  return (
    <Slider
      size="small"
      className={classNames(styles.slider, {
        [styles.animating]: isAnimating,
      })}
      data-dndkit-no-drag
      min={min}
      max={max}
      value={value}
    />
  );
};

const FPS = 50;

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const [lhs] = splitAtFirstEquality(item.properties.value);
  const [maxDigits, setMaxDigits] = useState<number | undefined>(2);
  const lhsRef = useRef(lhs);
  lhsRef.current = lhs;

  const [lastValidMin, setMin] = useState(-5);
  const [lastValidMax, setMax] = useState(-5);
  const [lastValidValue, setValue] = useState(0);
  const [lastValidDuration, setDuration] = useState(3);
  const speed = mustFindSpeed(item.properties.speedMultiplier);

  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const results = useMathResults(mathScope, item.id, resultNames);
  const isAnimating = !!results.isAnimating;

  useEffect(() => {
    setMin((v) => (typeof results.min === "number" ? results.min : v));
    setMax((v) => (typeof results.max === "number" ? results.max : v));
    setValue((v) => (typeof results.value === "number" ? results.value : v));
    setDuration((v) =>
      typeof results.duration === "number" ? results.duration : v
    );
  }, [results]);

  const onAnimationChange = useCallback(
    (animating: boolean) => {
      onWidgetChange({ name: "isAnimating", value: `${animating}` });
    },
    [onWidgetChange]
  );
  const onValueChange = useCallback(
    (v: number) => {
      setMaxDigits(2);
      const prefix = v > 0 ? "+" : "";
      onWidgetChange({
        name: "value",
        value: `${lhsRef.current}=${prefix}${v}`,
      });
    },
    [onWidgetChange]
  );
  const onManualChange: OnWidgetChange = useCallback(
    (e) => {
      setMaxDigits(undefined);
      onWidgetChange(e);
    },
    [onWidgetChange]
  );
  const onSpeedChange: SliderControlsProps["onSpeedChange"] = useCallback(
    (nextSpeed) => {
      onWidgetChange({ name: "speedMultiplier", value: nextSpeed.value });
    },
    [onWidgetChange]
  );
  const onStep: SliderControlsProps["onStep"] = useCallback(
    (step) => {
      const { increment } = getSliderParameters(
        lastValidMin,
        lastValidMax,
        FPS,
        lastValidDuration
      );
      onValueChange(lastValidValue + increment * step);
    },
    [
      lastValidValue,
      lastValidMin,
      lastValidMax,
      lastValidDuration,
      onValueChange,
    ]
  );
  return (
    <ItemTemplate item={item} config={config}>
      <div className={styles.controlsRow}>
        <MathAssignment
          label={configProps.value.label}
          error={errors.value}
          className={styles.sliderValue}
          lhsClassName={styles.displayValueLhs}
          rhsClassName={styles.displayValueRhs}
          name="value"
          value={item.properties.value}
          onChange={onManualChange}
          numDecimalDigits={maxDigits}
        />
        <SliderControls
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
          error={errors.min}
          onChange={onWidgetChange}
          label={configProps.min.label}
          value={item.properties.min}
        />
        <AnimatedSlider
          min={lastValidMin}
          max={lastValidMax}
          value={lastValidValue}
          fps={FPS}
          duration={lastValidDuration / speed.numeric}
          isAnimating={isAnimating}
          onChange={onValueChange}
        />
        <FieldWidget
          widget={WidgetType.MathValue}
          name="max"
          error={errors.max}
          onChange={onWidgetChange}
          label={configProps.max.label}
          value={item.properties.max}
        />
      </div>
    </ItemTemplate>
  );
};

export default VariableSlider;
