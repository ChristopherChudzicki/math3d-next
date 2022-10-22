import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@/configs";
import React, { useRef, useState, useEffect, useCallback } from "react";

import Slider, { SliderProps } from "@mui/material/Slider";
import { useInterval } from "@/util/hooks/useInterval";
import classNames from "classnames";
import { ParseableObjs } from "@/util/parsing";
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
import styles from "./slider.module.css";
import { OnWidgetChange } from "../../FieldWidget/types";

const config = configs[MIT.VariableSlider];
const configProps = config.properties;

const errorNames = ["value", "min", "max", "fps"] as const;
const resultNames = [
  "duration",
  "value",
  "min",
  "max",
  "fps",
  "isAnimating",
] as const;

interface AnimatedSliderProps {
  label: string;
  fps: number;
  baseDuration: number;
  speedMultiplier: number;
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
  baseDuration: number,
  speedMultiplier = 1
) => {
  const duration = baseDuration * speedMultiplier;
  const frames = fps * duration;
  const baseFrames = fps * baseDuration;
  const ms = (1 / fps) * 1000;
  const range = max - min;
  const increment = range / frames;
  const baseIncrement = range / baseFrames;
  return { increment, ms, baseIncrement };
};

const AnimatedSlider: React.FC<AnimatedSliderProps> = ({
  onChange,
  min,
  max,
  fps,
  baseDuration,
  speedMultiplier,
  value,
  isAnimating,
  label,
}) => {
  const valueRef = useRef(value);
  valueRef.current = value;
  const { baseIncrement, increment, ms } = getSliderParameters(
    min,
    max,
    fps,
    baseDuration,
    speedMultiplier
  );

  const tick = useCallback(() => {
    valueRef.current = wrap(valueRef.current + increment, min, max);
    onChange(valueRef.current);
  }, [increment, onChange, min, max]);
  const handleChange: NonNullable<SliderProps["onChange"]> = useCallback(
    (_e, v) => {
      if (!(typeof v === "number")) {
        throw new Error(`Expected a number, received ${JSON.stringify(v)}`);
      }
      valueRef.current = v;
      onChange(valueRef.current);
    },
    [onChange]
  );

  useInterval(tick, isAnimating ? ms : null);

  return (
    <Slider
      aria-label={label}
      size="small"
      className={classNames(styles.slider, {
        [styles.animating]: isAnimating,
      })}
      data-dndkit-no-drag
      onChange={handleChange}
      step={baseIncrement}
      min={min}
      max={max}
      value={value}
    />
  );
};

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const { lhs } = item.properties.value;
  const [maxDigits, setMaxDigits] = useState<number | undefined>(2);
  const lhsRef = useRef(lhs);
  lhsRef.current = lhs;

  const [lastValidFps, setFps] = useState(0.01);
  const [lastValidMin, setMin] = useState(-5);
  const [lastValidMax, setMax] = useState(+5);
  const [lastValidValue, setValue] = useState(0);
  const [lastValidDuration, setDuration] = useState(3);
  const speed = mustFindSpeed(item.properties.speedMultiplier);

  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const results = useMathResults(mathScope, item.id, resultNames);
  const isAnimating = !!results.isAnimating;

  useEffect(() => {
    setFps((v) => (typeof results.fps === "number" ? results.fps : v));
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
        value: {
          lhs: lhsRef.current,
          rhs: `${prefix}${v}`,
          type: "assignment",
        },
      });
    },
    [onWidgetChange]
  );
  const onManualChange: OnWidgetChange<ParseableObjs["assignment"]> =
    useCallback(
      (e) => {
        if (e.oldValue?.rhs !== e.value.rhs) {
          setMaxDigits(undefined);
        }
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
      const { baseIncrement } = getSliderParameters(
        lastValidMin,
        lastValidMax,
        lastValidFps,
        lastValidDuration
      );
      onValueChange(lastValidValue + baseIncrement * step);
    },
    [
      lastValidValue,
      lastValidMin,
      lastValidMax,
      lastValidFps,
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
          label={configProps.value.label}
          min={lastValidMin}
          max={lastValidMax}
          value={lastValidValue}
          fps={lastValidFps}
          speedMultiplier={speed.numeric}
          baseDuration={lastValidDuration}
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
