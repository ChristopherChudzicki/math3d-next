import { useMemo } from "react";
import {
  MathItemType as MIT,
  gradients,
  isGradientName,
} from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { Coords } from "@/features/viewport/shared/coordinates";
import { explicitColorFunc } from "@/features/viewport/shared/surfaceColor";
import type { SurfaceColorFunc } from "@/features/viewport/shared/surfaceColor";
import type { GraphicSpec, RGBA } from "./types";
import { parseColor } from "./types";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const SURFACE_PROPS = [
  "expr",
  "colorExpr",
  "domain",
  "samples1",
  "samples2",
  "grid1",
  "grid2",
  "gridWidth",
  "gridOpacity",
  "opacity",
  "shaded",
  "zBias",
  "zIndex",
] as const;

type SurfaceItem =
  | MIT.ParametricSurface
  | MIT.ExplicitSurface
  | MIT.ExplicitSurfacePolar;

type XYZ = (u: number, v: number) => Coords;

/** Each surface type's color function, called as MathBox calls it. */
const toColorFunc = (
  type: SurfaceItem,
  colorExpr: (...args: number[]) => number,
): SurfaceColorFunc =>
  type === MIT.ExplicitSurface ? explicitColorFunc(colorExpr) : colorExpr;

/** Lift each surface type's expression to a parametric (u, v) ↦ (x, y, z). */
const toParametric = (
  type: SurfaceItem,
  expr: ((...args: number[]) => number | number[]) | undefined,
): XYZ | undefined => {
  if (!expr) return undefined;
  switch (type) {
    case MIT.ExplicitSurface:
      return (x, y) => [x, y, +expr(x, y)];
    case MIT.ExplicitSurfacePolar:
      return (r, q) => [r * Math.cos(q), r * Math.sin(q), +expr(r, q)];
    default:
      return (u, v) => expr(u, v) as Coords;
  }
};

const Surface: SpecComponent<SurfaceItem> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const results = useMathItemResults(scope, item, SURFACE_PROPS);
  const {
    expr,
    colorExpr,
    domain,
    samples1,
    samples2,
    grid1,
    grid2,
    gridWidth,
    gridOpacity,
    opacity,
    shaded,
    zBias,
    zIndex,
  } = results;
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    const func = toParametric(item.type, expr);
    if (!visible || !func || !domain) return null;
    // Same (U, V) ∈ [0,1]² → (u, v) mapping as the MathBox surface: the second
    // parameter's domain may depend on the first.
    const { order } = domain;
    const [fu, fv] = order.map((i) => domain.value[i]);
    const [u1, u2] = fu(0);
    const uOf = (U: number) => u1 + (u2 - u1) * U;
    const vOf = (U: number, V: number) => {
      const [v1, v2] = fv(uOf(U));
      return v1 + (v2 - v1) * V;
    };
    const uv = (U: number, V: number): [number, number] =>
      order[0] === 0 ? [uOf(U), vOf(U, V)] : [vOf(U, V), uOf(U)];
    const position: XYZ = (U, V) => func(...uv(U, V));

    const alpha = opacity ?? 1;
    const gradient = isGradientName(color) ? gradients[color] : null;
    const flat = parseColor(color, alpha);
    const colorFunc = colorExpr && toColorFunc(item.type, colorExpr);
    const colorAt = (U: number, V: number): RGBA => {
      if (!gradient || !colorFunc) return flat;
      const [u, v] = uv(U, V);
      const [r, g, b] = gradient.getRGB(colorFunc(...position(U, V), u, v));
      return [r, g, b, alpha];
    };
    const gridColor: RGBA = gradient
      ? [0, 0, 0, gridOpacity ?? 0.5]
      : (flat.map((c, i) => (i < 3 ? c * 0.5 : gridOpacity ?? 0.5)) as RGBA);
    const count = (n: number | undefined, fallback: number) =>
      Math.max(2, Math.round(n ?? fallback));
    // 0 means no gridlines; a single line would make the sampler step Δ/0.
    const lineCount = (n: number | undefined, fallback: number) => {
      const rounded = Math.round(n ?? fallback);
      return rounded <= 0 ? 0 : Math.max(2, rounded);
    };
    return {
      kind: "surface",
      samples: [count(samples1, 64), count(samples2, 64)],
      position,
      colorAt,
      shaded: shaded ?? true,
      zBias: zBias ?? 0,
      zIndex: zIndex ?? 0,
      grid: {
        lines: [lineCount(grid1, 8), lineCount(grid2, 8)],
        width: gridWidth ?? 2,
        color: gridColor,
      },
    };
  }, [
    item.type,
    visible,
    expr,
    colorExpr,
    domain,
    samples1,
    samples2,
    grid1,
    grid2,
    gridWidth,
    gridOpacity,
    opacity,
    shaded,
    zBias,
    zIndex,
    color,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

export default Surface;
