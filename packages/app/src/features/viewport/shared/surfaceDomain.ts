import type { Coords } from "@math3d/viewport-spec";

type Range = [number, number];

/**
 * A surface item's evaluated domain: each parameter's range as a function of
 * the other parameter. `order` lists the parameter whose range is constant
 * first.
 */
type SurfaceDomain = {
  value: [(param: number) => Range, (param: number) => Range];
  order: [number, number];
};

/**
 * Past this many arguments a range function's cache starts over, so that
 * changing sample counts, which bring new arguments, can't grow it forever.
 */
const MAX_CACHED_RANGES = 1024;

/**
 * `range` with its results kept by argument: a sampler asks once per sample,
 * and a grid has few distinct arguments.
 */
const cached = (range: (param: number) => Range) => {
  const ranges = new Map<number, Range>();
  return (param: number): Range => {
    const known = ranges.get(param);
    if (known) return known;
    const value = range(param);
    if (ranges.size >= MAX_CACHED_RANGES) ranges.clear();
    ranges.set(param, value);
    return value;
  };
};

/**
 * Maps (U, V) ∈ [0, 1]² onto the domain's parameters. U spans the constant
 * range; V spans the other's, evaluated at U's parameter value.
 */
const domainMap = (domain: SurfaceDomain) => {
  const { order } = domain;
  const [fFirst, fSecond] = order.map((i) => cached(domain.value[i]));
  // Range functions first run at a sample: both renderers build the map
  // during render, where a throw would reach the route's error page.
  const first = (U: number) => {
    const [a1, a2] = fFirst(0);
    return a1 + (a2 - a1) * U;
  };
  const second = (U: number, V: number) => {
    const [b1, b2] = fSecond(first(U));
    return b1 + (b2 - b1) * V;
  };
  return (U: number, V: number): Range =>
    order[0] === 0 ? [first(U), second(U, V)] : [second(U, V), first(U)];
};

type Expr2 = (a: number, b: number) => number;

/** An explicit surface z = f(x, y) as a parametric surface. */
const explicitSurface =
  (expr: Expr2) =>
  (x: number, y: number): Coords => [x, y, +expr(x, y)];

/** A polar explicit surface z = f(r, θ) as a parametric surface. */
const explicitPolarSurface =
  (expr: Expr2) =>
  (r: number, q: number): Coords => [
    r * Math.cos(q),
    r * Math.sin(q),
    +expr(r, q),
  ];

export { domainMap, explicitSurface, explicitPolarSurface };
export type { SurfaceDomain };
