import type { Coords } from "./coordinates";

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
 * Maps (U, V) ∈ [0, 1]² onto the domain's parameters. U spans the constant
 * range; V spans the other's, evaluated at U's parameter value.
 */
const domainMap = (domain: SurfaceDomain) => {
  const { order } = domain;
  const [fFirst, fSecond] = order.map((i) => domain.value[i]);
  const [a1, a2] = fFirst(0);
  const first = (U: number) => a1 + (a2 - a1) * U;
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
