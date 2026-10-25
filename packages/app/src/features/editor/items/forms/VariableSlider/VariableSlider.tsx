import {
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import React, { useRef, useState, useCallback, useMemo } from "react";

import Slider from "@/ui/Slider";
import { useFrameTicks } from "@/util/hooks/useFrameTicks";
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
import styles from "./slider.module.css";

const config = configs[MIT.VariableSlider];
const configProps = config.properties;

const errorNames = ["value", "range", "fps"] as const;
const fallbacks = { fps: 60, min: -5, max: 5, value: 0, duration: 4 };
const resultNames = [
  "duration",
  "value",
  "range",
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
  onChange: (value: number, clean?: boolean) => void;
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
  speedMultiplier = 1,
) => {
  const duration = baseDuration / speedMultiplier;
  const frames = fps * duration;
  const baseFrames = fps * baseDuration;
  const range = max - min;
  const increment = range / frames;
  const baseIncrement = range / baseFrames;
  return { increment, baseIncrement };
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
  const { baseIncrement, increment } = getSliderParameters(
    min,
    max,
    fps,
    baseDuration,
    speedMultiplier,
  );

  const onTicks = useCallback(
    (elapsed: number) => {
      valueRef.current = wrap(valueRef.current + elapsed * increment, min, max);
      onChange(valueRef.current, true);
    },
    [increment, onChange, min, max],
  );
  const handleChange = useCallback(
    (v: number) => {
      valueRef.current = v;
      onChange(valueRef.current);
    },
    [onChange],
  );

  useFrameTicks(onTicks, isAnimating ? fps : null);

  return (
    <Slider
      aria-label={label}
      data-dndkit-no-drag
      onValueChange={handleChange}
      step={baseIncrement}
      largeStep={(max - min) / 10}
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

  const speed = mustFindSpeed(item.properties.speedMultiplier);

  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const results = useMathResults(mathScope, item.id, resultNames);
  const isAnimating = !!results.isAnimating;

  // Results keep their last valid value while an expression errors, so the
  // fallbacks only apply until the first valid evaluation.
  const resultRange = results.range as [number, number] | undefined;
  const fps = typeof results.fps === "number" ? results.fps : fallbacks.fps;
  const min = resultRange ? resultRange[0] : fallbacks.min;
  const max = resultRange ? resultRange[1] : fallbacks.max;
  const value =
    typeof results.value === "number" ? results.value : fallbacks.value;
  const duration =
    typeof results.duration === "number"
      ? results.duration
      : fallbacks.duration;

  const onAnimationChange = useCallback(
    (animating: boolean) => {
      onWidgetChange({ name: "isAnimating", value: `${animating}` });
    },
    [onWidgetChange],
  );
  const onValueChange = useCallback(
    (v: number, clean?: boolean) => {
      setMaxDigits(2);
      const prefix = v > 0 ? "+" : "";
      onWidgetChange(
        {
          name: "value",
          value: {
            lhs: lhsRef.current,
            rhs: `${prefix}${v}`,
            type: "assignment",
          },
        },
        clean,
      );
    },
    [onWidgetChange],
  );
  const onManualChange: OnWidgetChange<ParseableObjs["assignment"]> =
    useCallback(
      (e) => {
        if (e.oldValue?.rhs !== e.value.rhs) {
          setMaxDigits(undefined);
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
  const onStep: SliderControlsProps["onStep"] = useCallback(
    (step) => {
      const { baseIncrement } = getSliderParameters(min, max, fps, duration);
      onValueChange(value + baseIncrement * step);
    },
    [value, min, max, fps, duration, onValueChange],
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
          numDecimalDigits={maxDigits}
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
        <AnimatedSlider
          label={configProps.value.label}
          min={min}
          max={max}
          value={value}
          fps={fps}
          speedMultiplier={speed.numeric}
          baseDuration={duration}
          isAnimating={isAnimating}
          onChange={onValueChange}
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
