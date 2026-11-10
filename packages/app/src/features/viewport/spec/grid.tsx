import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { baseStyle } from "./style";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const GRID_PROPS = [
  "divisions",
  "width",
  "opacity",
  "zBias",
  "zIndex",
  "snap",
] as const;

const Grid: SpecComponent<MIT.Grid> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { divisions, width, opacity, zBias, zIndex, snap } = useMathItemResults(
    scope,
    item,
    GRID_PROPS,
  );
  const { color, axes } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible) return null;
    return {
      kind: "grid",
      axes,
      divisions: [divisions?.[0] ?? 10, divisions?.[1] ?? 10],
      snap: !!snap,
      width: width ?? 1,
      ...baseStyle({ opacity, zBias, zIndex }, color),
    };
  }, [visible, axes, divisions, snap, width, color, opacity, zBias, zIndex]);
  useReportSpec(item.id, spec);
  return null;
};

export default Grid;
