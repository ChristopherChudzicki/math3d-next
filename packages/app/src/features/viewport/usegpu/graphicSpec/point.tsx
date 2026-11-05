import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "./types";
import { parseColor } from "./types";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const POINT_PROPS = ["coords", "size", "opacity", "zBias", "zIndex"] as const;

const Point: SpecComponent<MIT.Point> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { coords, size, opacity, zBias, zIndex } = useMathItemResults(
    scope,
    item,
    POINT_PROPS,
  );
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !coords) return null;
    return {
      kind: "point",
      positions: coords,
      size: size ?? 8,
      color: parseColor(color, opacity ?? 1),
      zBias: zBias ?? 0,
      zIndex: zIndex ?? 0,
    };
  }, [visible, coords, size, color, opacity, zBias, zIndex]);
  useReportSpec(item.id, spec);
  return null;
};

export default Point;
