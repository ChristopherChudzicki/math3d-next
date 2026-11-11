import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { baseStyle, visibleLabel } from "./style";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

// MathBox draws its circle points (`optical`, on by default) 1.2 × their
// stored size across, and saved scenes' sizes were chosen against that.
const MATHBOX_POINT_SCALE = 1.2;

const POINT_PROPS = [
  "coords",
  "size",
  "opacity",
  "zBias",
  "zIndex",
  "labelVisible",
] as const;

const Point: SpecComponent<MIT.Point> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { coords, size, opacity, zBias, zIndex, labelVisible } =
    useMathItemResults(scope, item, POINT_PROPS);
  const { color, label } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !coords) return null;
    return {
      kind: "point",
      positions: coords,
      size: MATHBOX_POINT_SCALE * (size ?? 8),
      ...baseStyle({ opacity, zBias, zIndex }, color),
      label: visibleLabel(label, labelVisible),
    };
  }, [
    visible,
    coords,
    size,
    color,
    opacity,
    zBias,
    zIndex,
    label,
    labelVisible,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

export default Point;
