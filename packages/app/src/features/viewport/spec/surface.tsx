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
import type { Coords, GraphicSpec, RGBA } from "@math3d/viewport-spec";
import {
  domainMap,
  explicitPolarSurface,
  explicitSurface,
} from "@/features/viewport/shared/surfaceDomain";
import { explicitColorFunc } from "@/features/viewport/shared/surfaceColor";
import type { SurfaceColorFunc } from "@/features/viewport/shared/surfaceColor";
import { baseStyle, sampleCount } from "./style";
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
  const spec = useMemo<GraphicSpec | null>(() => {
    const func = toParametric(item.type, expr);
    if (!visible || !func || !domain) return null;
    const uv = domainMap(domain);
    const position: XYZ = (U, V) => func(...uv(U, V));

    const gradient = isGradientName(color) ? gradients[color] : null;
    const base = baseStyle({ opacity, zBias, zIndex }, color);
    const flat = base.color;
    const alpha = flat[3];
    const colorFunc = colorExpr && toColorFunc(item.type, colorExpr);
    const colorAt = (U: number, V: number): RGBA => {
      if (!gradient || !colorFunc) return flat;
      const [u, v] = uv(U, V);
      const [r, g, b] = gradient.getRGB(colorFunc(...position(U, V), u, v));
      return [r, g, b, alpha];
    };
    // Like MathBox: grey gridlines on a gradient, else the surface color at half brightness.
    const gridColor: RGBA = gradient
      ? [0.5, 0.5, 0.5, gridOpacity ?? 0.5]
      : (flat.map((c, i) => (i < 3 ? c * 0.5 : gridOpacity ?? 0.5)) as RGBA);
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
