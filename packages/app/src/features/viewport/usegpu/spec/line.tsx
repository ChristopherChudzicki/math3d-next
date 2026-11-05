import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { Coords } from "@/features/viewport/shared/coordinates";
import type { GraphicSpec, LineSpec } from "./types";
import { parseColor } from "./types";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

type LineStyle = Omit<LineSpec, "kind" | "paths">;

/**
 * The style fields every line-like item shares. Until a result evaluates, each
 * falls back to the Line item's default (`defaultWidth` overrides the width).
 */
export const lineStyle = (
  results: {
    width?: number;
    opacity?: number;
    zBias?: number;
    zIndex?: number;
    start?: boolean;
    end?: boolean;
    size?: number;
  },
  color: string,
  defaultWidth = 4,
): LineStyle => ({
  width: results.width ?? defaultWidth,
  color: parseColor(color, results.opacity ?? 1),
  zBias: results.zBias ?? 0,
  zIndex: results.zIndex ?? 0,
  start: !!results.start,
  end: !!results.end,
  arrowSize: results.size ?? 6,
});

const LINE_PROPS = [
  "coords",
  "width",
  "opacity",
  "zBias",
  "zIndex",
  "start",
  "end",
  "size",
] as const;

export const Line: SpecComponent<MIT.Line> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { coords, width, opacity, zBias, zIndex, start, end, size } =
    useMathItemResults(scope, item, LINE_PROPS);
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !coords) return null;
    return {
      kind: "line",
      paths: [coords],
      ...lineStyle({ width, opacity, zBias, zIndex, start, end, size }, color),
    };
  }, [visible, coords, width, color, opacity, zBias, zIndex, start, end, size]);
  useReportSpec(item.id, spec);
  return null;
};

const CURVE_PROPS = [
  "expr",
  "domain",
  "samples1",
  "width",
  "opacity",
  "zBias",
  "zIndex",
  "start",
  "end",
  "size",
] as const;

export const ParametricCurve: SpecComponent<MIT.ParametricCurve> = ({
  item,
}) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const {
    expr,
    domain,
    samples1,
    width,
    opacity,
    zBias,
    zIndex,
    start,
    end,
    size,
  } = useMathItemResults(scope, item, CURVE_PROPS);
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !expr || !domain) return null;
    const [t1, t2] = domain[0];
    const n = Math.max(2, Math.round(samples1 ?? 128));
    const path: Coords[] = [];
    for (let i = 0; i < n; i += 1) {
      const [x, y, z] = expr(t1 + ((t2 - t1) * i) / (n - 1));
      path.push([+x, +y, +z]);
    }
    return {
      kind: "line",
      paths: [path],
      ...lineStyle({ width, opacity, zBias, zIndex, start, end, size }, color),
    };
  }, [
    visible,
    expr,
    domain,
    samples1,
    width,
    color,
    opacity,
    zBias,
    zIndex,
    start,
    end,
    size,
  ]);
  useReportSpec(item.id, spec);
  return null;
};
