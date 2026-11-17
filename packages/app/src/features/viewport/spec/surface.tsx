import { useMemo } from "react";
import {
  MathItemType as MIT,
  gradients,
  isGradientName,
} from "@math3d/mathitem-configs";
import { wrapsAtOne } from "@math3d/parser";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { Coords, GraphicSpec, RGBA } from "@math3d/viewport-spec";
import {
  domainMap,
  explicitPolarSurface,
  explicitSurface,
} from "@/features/viewport/shared/surfaceDomain";
import {
  explicitColorFunc,
  gridlineColor,
} from "@/features/viewport/shared/surfaceColor";
import type { SurfaceColorFunc } from "@/features/viewport/shared/surfaceColor";
import { baseStyle, parseColor, sampleCount } from "./style";
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
      return explicitSurface(expr as (x: number, y: number) => number);
    case MIT.ExplicitSurfacePolar:
      return explicitPolarSurface(expr as (r: number, q: number) => number);
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
  // Apart from the spec memo so a color- or style-only change keeps
  // `position`; renderers resample on a new one.
  const parametric = useMemo(() => {
    const func = toParametric(item.type, expr);
    if (!func || !domain) return null;
    const uv = domainMap(domain);
    const position: XYZ = (U, V) => func(...uv(U, V));
    return { uv, position };
  }, [item.type, expr, domain]);
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !parametric) return null;
    const { uv, position } = parametric;

    const gradient = isGradientName(color) ? gradients[color] : null;
    const base = baseStyle({ opacity, zBias, zIndex }, color);
    const flat = base.color;
    const alpha = flat[3];
    const colorFunc = colorExpr && toColorFunc(item.type, colorExpr);
    const valueAt =
      colorFunc &&
      ((U: number, V: number, point: Coords) =>
        colorFunc(...point, ...uv(U, V)));
    const colorAt = (U: number, V: number): RGBA => {
      if (!gradient || !valueAt) return flat;
      const [r, g, b] = gradient.getRGB(valueAt(U, V, position(U, V)));
      return [r, g, b, alpha];
    };
    const periodicColor =
      gradient && colorExpr && valueAt && wrapsAtOne(colorExpr)
        ? { map: gradient.getRGB, valueAt, alpha }
        : undefined;
    // On a gradient, MathBox's default line color.
    const gridColor: RGBA = gradient
      ? [0.5, 0.5, 0.5, gridOpacity ?? 0.5]
      : parseColor(gridlineColor(color), gridOpacity ?? 0.5);
    // 0 means no gridlines; a single line would make the sampler step Δ/0.
    const lineCount = (n: number | undefined, fallback: number) => {
      const rounded = Math.round(n ?? fallback);
      return rounded <= 0 ? 0 : Math.max(2, rounded);
    };
    return {
      kind: "surface",
      samples: [sampleCount(samples1, 64), sampleCount(samples2, 64)],
      position,
      colorAt,
      periodicColor,
      shaded: shaded ?? true,
      zBias: base.zBias,
      zIndex: base.zIndex,
      grid: {
        lines: [lineCount(grid1, 8), lineCount(grid2, 8)],
        width: gridWidth ?? 2,
        color: gridColor,
      },
    };
  }, [
    item.type,
    visible,
    parametric,
    colorExpr,
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
