import React from "react";
import { shallowEqual } from "react-redux";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import * as select from "@/store/scene/state/selectors";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  mathScopeId,
  useMathResults,
} from "@/store/scene/evaluation/mathScope";
import { useFrameTicks } from "@/util/hooks/useFrameTicks";
import {
  mustFindSpeed,
  sliderNumbers,
  sliderStep,
  valueAssignment,
  wrap,
} from "./sliderMath";

const resultNames = ["duration", "range", "fps", "isAnimating"] as const;

// Undefined only transiently, between a slider's removal and the commit that
// unmounts its animation.
const sliderItem = (state: RootState, id: string) =>
  state.scene.items[id] as MathItem<MIT.VariableSlider> | undefined;

/**
 * Advances slider `id` on animation frames while it's animating.
 */
const useSliderAnimation = (id: string) => {
  const dispatch = useAppDispatch();
  const lhs = useAppSelector((s) => sliderItem(s, id)?.properties.value.lhs);
  const speedValue = useAppSelector(
    (s) => sliderItem(s, id)?.properties.speedMultiplier,
  );
  const mathScope = useMathScope();
  const results = useMathResults(mathScope, id, resultNames);
  const { fps, min, max, duration } = sliderNumbers(results);
  const isAnimating = !!results.isAnimating;
  // Looked up only while animating, so an unknown saved speed can't throw for
  // a slider that isn't playing.
  const speed =
    isAnimating && speedValue ? mustFindSpeed(speedValue).numeric : 1;
  const increment = sliderStep(min, max, fps, duration) * speed;

  useFrameTicks(
    (elapsed) => {
      // Read at tick time, not from React state: evaluation is synchronous, so
      // this includes a value the user set since the last render. It's absent
      // while the value expression is invalid, which pauses playback.
      const value = mathScope.results.get(mathScopeId(id, "value"));
      if (typeof value !== "number" || lhs === undefined) return;
      const next = wrap(value + elapsed * increment, min, max);
      dispatch(
        actions.setProperties(
          {
            id,
            type: MIT.VariableSlider,
            properties: { value: valueAssignment(lhs, next) },
          },
          /* clean */ true,
        ),
      );
    },
    isAnimating ? fps : null,
  );
};

const SliderAnimation: React.FC<{ id: string }> = ({ id }) => {
  useSliderAnimation(id);
  return null;
};

const sliderIds = (state: RootState) =>
  Object.values(state.scene.items)
    .filter((item) => item.type === MIT.VariableSlider)
    .map((item) => item.id);

/**
 * Animates sliders. This lives outside the slider's form so animation
 * continues while the form is unmounted (e.g., on another sidebar tab) and runs
 * once per slider while the drag overlay shows a copy of the form.
 */
const SliderAnimations: React.FC = () => {
  const ids = useAppSelector(sliderIds, shallowEqual);
  // Item ids recur across scenes; remount so no animation carries over.
  const loadCount = useAppSelector(select.loadCount);
  return (
    <React.Fragment key={loadCount}>
      {ids.map((id) => (
        <SliderAnimation key={id} id={id} />
      ))}
    </React.Fragment>
  );
};

export default SliderAnimations;
