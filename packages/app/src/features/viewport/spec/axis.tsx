import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { visibleLabel } from "./style";
import { useLineStyle } from "./line";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";
import { linearTicks } from "./ticks";

const AXIS_PROPS = [
  "min",
  "max",
  "divisions",
  "ticksVisible",
  "labelVisible",
] as const;

const Axis: SpecComponent<MIT.Axis> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { min, max, divisions, ticksVisible, labelVisible } =
    useMathItemResults(scope, item, AXIS_PROPS);
  const style = useLineStyle(scope, item, 2);
  const { axis, label } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible) return null;
    const range: [number, number] = [min ?? -1, max ?? 1];
    const split = divisions ?? 10;
    return {
      kind: "axis",
      axis,
      ...style,
      range,
      ticks: {
        divisions: split,
        visible: !!ticksVisible,
        values: linearTicks(range, split, { zero: false, nice: true }),
      },
      label: visibleLabel(label, labelVisible),
    };
  }, [
    visible,
    axis,
    style,
    min,
    max,
    divisions,
    ticksVisible,
    labelVisible,
    label,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

export default Axis;
