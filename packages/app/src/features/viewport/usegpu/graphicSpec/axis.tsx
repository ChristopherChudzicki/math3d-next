import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "./types";
import { lineStyle } from "./line";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const AXIS_PROPS = [
  "width",
  "opacity",
  "zBias",
  "zIndex",
  "start",
  "end",
  "size",
] as const;

const Axis: SpecComponent<MIT.Axis> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { width, opacity, zBias, zIndex, start, end, size } =
    useMathItemResults(scope, item, AXIS_PROPS);
  const { color, axis } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible) return null;
    return {
      kind: "axis",
      axis,
      ...lineStyle(
        { width, opacity, zBias, zIndex, start, end, size },
        color,
        2,
      ),
    };
  }, [visible, axis, width, color, opacity, zBias, zIndex, start, end, size]);
  useReportSpec(item.id, spec);
  return null;
};

export default Axis;
