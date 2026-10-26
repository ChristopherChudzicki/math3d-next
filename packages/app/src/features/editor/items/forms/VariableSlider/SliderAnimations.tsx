import React, { useCallback } from "react";
import { shallowEqual } from "react-redux";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  mathScopeId,
  useMathResults,
} from "@/store/scene/evaluation/mathScope";
import { useFrameTicks } from "@/util/hooks/useFrameTicks";
import { mustFindSpeed } from "./SliderControls";
import {
  getSliderParameters,
  sliderNumbers,
  valueAssignment,
  wrap,
} from "./sliderMath";

const resultNames = ["duration", "range", "fps", "isAnimating"] as const;

/**
 * Advances slider `id` on animation frames while it's animating.
 */
const useSliderTicker = (id: string) => {
  const dispatch = useAppDispatch();
  // Undefined only transiently, between the slider's removal and the commit
  // that unmounts this ticker.
  const item = useAppSelector(
    (state) =>
      state.scene.items[id] as MathItem<MIT.VariableSlider> | undefined,
  );
  const mathScope = useMathScope();
  const results = useMathResults(mathScope, id, resultNames);
  const { fps, min, max, duration } = sliderNumbers(results);
  const speed = item ? mustFindSpeed(item.properties.speedMultiplier) : null;
  const lhs = item?.properties.value.lhs;
  const { increment } = getSliderParameters(
    min,
    max,
    fps,
    duration,
    speed?.numeric,
  );

  const onTicks = useCallback(
    (elapsed: number) => {
      // Read at tick time, not from React state: evaluation is synchronous,
      // so this includes a value the user dragged to since the last render.
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
          true,
        ),
      );
    },
    [dispatch, mathScope, id, lhs, increment, min, max],
  );

  useFrameTicks(onTicks, results.isAnimating ? fps : null);
};

const SliderTicker: React.FC<{ id: string }> = ({ id }) => {
  useSliderTicker(id);
  return null;
};

const sliderIds = (state: RootState) =>
  Object.values(state.scene.items)
    .filter((item) => item.type === MIT.VariableSlider)
    .map((item) => item.id);

/**
 * Runs slider playback. Playback lives here, not in the slider's form, so it
 * continues while the form is unmounted (e.g., on another sidebar tab) and runs
 * once per slider while the drag overlay shows a copy of the form.
 */
const SliderAnimations: React.FC = () => {
  const ids = useAppSelector(sliderIds, shallowEqual);
  return ids.map((id) => <SliderTicker key={id} id={id} />);
};

export default SliderAnimations;
