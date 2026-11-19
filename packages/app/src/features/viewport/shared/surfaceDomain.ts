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
 * Past this many values of U the map's cache starts over, so that changing
 * sample counts, which bring new values, can't grow it forever.
 */
const MAX_CACHED_COLUMNS = 1024;

/**
 * Maps (U, V) ∈ [0, 1]² onto the domain's parameters. U spans the constant
 * range; V spans the other's, evaluated at U's parameter value.
 *
 * What depends only on U is kept by U: a sampler asks once per sample, and a
 * grid has few distinct values of U.
 */
const domainMap = (domain: SurfaceDomain) => {
  const { order } = domain;
  const [rangeOfFirst, rangeOfSecond] = order.map((i) => domain.value[i]);
  let firstRange: Range | undefined;
  const columns = new Map<
    number,
    { first: number; low: number; high: number }
  >();
  // Range functions run at the first sample that needs them, never while the
  // map is built: both renderers build it during render.
  return (U: number, V: number): Range => {
    let column = columns.get(U);
    if (!column) {
      firstRange ??= rangeOfFirst(0);
      const first = firstRange[0] + (firstRange[1] - firstRange[0]) * U;
      const [low, high] = rangeOfSecond(first);
      column = { first, low, high };
      if (columns.size >= MAX_CACHED_COLUMNS) columns.clear();
      columns.set(U, column);
    }
    const { first, low, high } = column;
    const second = low + (high - low) * V;
    return order[0] === 0 ? [first, second] : [second, first];
  };
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
