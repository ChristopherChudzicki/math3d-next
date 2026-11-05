import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { AppMathScope } from "@/store/scene/state/interfaces";
import type { Coords } from "@/features/viewport/shared/coordinates";
import type { GraphicSpec, LineSpec } from "./types";
import { baseStyle, sampleCount, visibleLabel } from "./style";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

export type LineStyle = Omit<LineSpec, "kind" | "paths" | "label">;

export const LINE_STYLE_PROPS = [
  "width",
  "opacity",
  "zBias",
  "zIndex",
  "start",
  "end",
  "size",
] as const;

type LineLike = MathItem<
  MIT.Line | MIT.ParametricCurve | MIT.Vector | MIT.VectorField | MIT.Axis
>;

/**
 * The style fields every line-like item shares, memoized. Until a result
 * evaluates, each falls back to the Line item's default (`defaultWidth`
 * overrides the width).
 */
export const useLineStyle = (
  scope: AppMathScope,
  item: LineLike,
  defaultWidth = 4,
): LineStyle => {
  const { width, opacity, zBias, zIndex, start, end, size } =
    useMathItemResults(scope, item, LINE_STYLE_PROPS);
  const { color } = item.properties;
  return useMemo(
    () => ({
      width: width ?? defaultWidth,
      ...baseStyle({ opacity, zBias, zIndex }, color),
      start: !!start,
      end: !!end,
      arrowSize: size ?? 6,
    }),
    [width, opacity, zBias, zIndex, start, end, size, color, defaultWidth],
  );
};

const LINE_PROPS = ["coords", "labelVisible"] as const;

export const Line: SpecComponent<MIT.Line> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { coords, labelVisible } = useMathItemResults(scope, item, LINE_PROPS);
  const style = useLineStyle(scope, item);
  const { label } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !coords) return null;
    return {
      kind: "line",
      paths: [coords],
      ...style,
      label: visibleLabel(label, labelVisible),
    };
  }, [visible, coords, style, label, labelVisible]);
  useReportSpec(item.id, spec);
  return null;
};

const CURVE_PROPS = ["expr", "domain", "samples1"] as const;

export const ParametricCurve: SpecComponent<MIT.ParametricCurve> = ({
  item,
}) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { expr, domain, samples1 } = useMathItemResults(
    scope,
    item,
    CURVE_PROPS,
  );
  const style = useLineStyle(scope, item);
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !expr || !domain) return null;
    const [t1, t2] = domain[0];
    const n = sampleCount(samples1, 128);
    const path: Coords[] = [];
    for (let i = 0; i < n; i += 1) {
      const [x, y, z] = expr(t1 + ((t2 - t1) * i) / (n - 1));
      path.push([+x, +y, +z]);
    }
    return { kind: "line", paths: [path], ...style, label: null };
  }, [visible, expr, domain, samples1, style]);
  useReportSpec(item.id, spec);
  return null;
};
