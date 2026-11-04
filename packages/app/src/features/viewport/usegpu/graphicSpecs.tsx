/**
 * React components that turn each math item into a renderer-neutral
 * `GraphicSpec`. They use the same store and MathScope hooks as the MathBox
 * graphics in ../graphics, and report their spec to the collector instead of
 * rendering anything.
 */
import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  MathGraphic,
  MathItemType as MIT,
  gradients,
  isGradientName,
} from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { AxesRange } from "@/features/viewport/graphics/interfaces";
import { project } from "@/features/viewport/graphics/util";
import type { Coords, GraphicSpec, RGBA } from "./specs";
import { parseColor } from "./specs";

type Report = (id: string, spec: GraphicSpec | null) => void;

export const SpecCollector = createContext<Report>(() => {});

/** Report `spec` while mounted; `null` while the graphic has nothing to draw. */
const useReportSpec = (id: string, spec: GraphicSpec | null) => {
  const report = useContext(SpecCollector);
  useLayoutEffect(() => {
    report(id, spec);
    return () => report(id, null);
  }, [report, id, spec]);
};

type Props<T extends MIT> = {
  item: MathGraphic & { type: T };
};

const POINT_PROPS = ["coords", "size", "opacity", "zBias"] as const;
const Point: React.FC<Props<MIT.Point>> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { coords, size, opacity, zBias } = useMathItemResults(
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
    };
  }, [visible, coords, size, color, opacity, zBias]);
  useReportSpec(item.id, spec);
  return null;
};

const LINE_PROPS = [
  "coords",
  "width",
  "opacity",
  "zBias",
  "start",
  "end",
  "size",
] as const;
const Line: React.FC<Props<MIT.Line>> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { coords, width, opacity, zBias, start, end, size } =
    useMathItemResults(scope, item, LINE_PROPS);
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !coords) return null;
    return {
      kind: "line",
      paths: [coords],
      width: width ?? 4,
      color: parseColor(color, opacity ?? 1),
      zBias: zBias ?? 0,
      start: !!start,
      end: !!end,
      arrowSize: size ?? 6,
    };
  }, [visible, coords, width, color, opacity, zBias, start, end, size]);
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
  "start",
  "end",
  "size",
] as const;
const ParametricCurve: React.FC<Props<MIT.ParametricCurve>> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { expr, domain, samples1, width, opacity, zBias, start, end, size } =
    useMathItemResults(scope, item, CURVE_PROPS);
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
      width: width ?? 4,
      color: parseColor(color, opacity ?? 1),
      zBias: zBias ?? 0,
      start: !!start,
      end: !!end,
      arrowSize: size ?? 6,
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
    start,
    end,
    size,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

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
] as const;

type SurfaceItem =
  | MIT.ParametricSurface
  | MIT.ExplicitSurface
  | MIT.ExplicitSurfacePolar;

type XYZ = (u: number, v: number) => Coords;

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

const RANGE_01: [number, number] = [0, 1];
const NORMALIZED_RANGE: AxesRange = [RANGE_01, RANGE_01, RANGE_01];
const BLACK: RGBA = [0, 0, 0, 1];

const Surface: React.FC<Props<SurfaceItem> & { range: AxesRange }> = ({
  item,
  range,
}) => {
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
    const colorAt = (U: number, V: number): RGBA => {
      if (!gradient || !colorExpr) return flat;
      const xyz = position(U, V);
      const [X, Y, Z] = project(xyz, range, NORMALIZED_RANGE);
      const [u, v] = uv(U, V);
      const [r, g, b] = gradient.getRGB(colorExpr(X, Y, Z, u, v));
      return [r, g, b, alpha];
    };
    const gridColor: RGBA = gradient
      ? [0, 0, 0, gridOpacity ?? 0.5]
      : (flat.map((c, i) => (i < 3 ? c * 0.5 : gridOpacity ?? 0.5)) as RGBA);
    const count = (n: number | undefined, fallback: number) =>
      Math.max(2, Math.round(n ?? fallback));
    return {
      kind: "surface",
      samples: [count(samples1, 64), count(samples2, 64)],
      position,
      colorAt,
      shaded: shaded ?? true,
      zBias: zBias ?? 0,
      grid: {
        lines: [Math.round(grid1 ?? 8), Math.round(grid2 ?? 8)],
        width: gridWidth ?? 2,
        color: gridColor ?? BLACK,
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
    color,
    range,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

const IMPLICIT_PROPS = [
  "lhs",
  "rhs",
  "domain",
  "samples",
  "opacity",
  "shaded",
  "zBias",
] as const;
const ImplicitSurface: React.FC<Props<MIT.ImplicitSurface>> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { lhs, rhs, domain, samples, opacity, shaded, zBias } =
    useMathItemResults(scope, item, IMPLICIT_PROPS);
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !lhs || !rhs || !domain) return null;
    return {
      kind: "implicit",
      domain,
      samples: Math.max(2, Math.round(samples ?? 20)),
      value: (x, y, z) => lhs(x, y, z) - rhs(x, y, z),
      color: parseColor(color, opacity ?? 1),
      shaded: shaded ?? true,
      zBias: zBias ?? 0,
    };
  }, [visible, lhs, rhs, domain, samples, color, opacity, shaded, zBias]);
  useReportSpec(item.id, spec);
  return null;
};

const AXIS_PROPS = [
  "width",
  "opacity",
  "zBias",
  "start",
  "end",
  "size",
] as const;
const Axis: React.FC<Props<MIT.Axis>> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { width, opacity, zBias, start, end, size } = useMathItemResults(
    scope,
    item,
    AXIS_PROPS,
  );
  const { color, axis } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible) return null;
    return {
      kind: "axis",
      axis,
      width: width ?? 2,
      color: parseColor(color, opacity ?? 1),
      zBias: zBias ?? 0,
      start: !!start,
      end: !!end,
      arrowSize: size ?? 6,
    };
  }, [visible, axis, width, color, opacity, zBias, start, end, size]);
  useReportSpec(item.id, spec);
  return null;
};

const GRID_PROPS = ["divisions", "width", "opacity", "zBias", "snap"] as const;
const Grid: React.FC<Props<MIT.Grid>> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { divisions, width, opacity, zBias, snap } = useMathItemResults(
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
      color: parseColor(color, opacity ?? 1),
      zBias: zBias ?? 0,
    };
  }, [visible, axes, divisions, snap, width, color, opacity, zBias]);
  useReportSpec(item.id, spec);
  return null;
};

/** Vectors, vector fields and labels are not drawn by the spike. */
export const GraphicSpecReporter: React.FC<{
  item: MathGraphic;
  range: AxesRange;
}> = ({ item, range }) => {
  switch (item.type) {
    case MIT.Point:
      return <Point item={item} />;
    case MIT.Line:
      return <Line item={item} />;
    case MIT.ParametricCurve:
      return <ParametricCurve item={item} />;
    case MIT.ParametricSurface:
    case MIT.ExplicitSurface:
    case MIT.ExplicitSurfacePolar:
      return <Surface item={item} range={range} />;
    case MIT.ImplicitSurface:
      return <ImplicitSurface item={item} />;
    case MIT.Axis:
      return <Axis item={item} />;
    case MIT.Grid:
      return <Grid item={item} />;
    default:
      return null;
  }
};
