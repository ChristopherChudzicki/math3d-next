import { bench, describe } from "vitest";
import { latexParser } from "@math3d/parser";
import { validators } from "@math3d/validators";

/**
 * Times sampling user functions the way the viewport does: parsed and
 * validated as an item property is, then called once per sample.
 *
 * Run with `yarn workspace @math3d/mathitem-configs bench`.
 */

type Scope = Map<string, unknown>;

const define = (scope: Scope, name: string, params: string[], rhs: string) => {
  const node = latexParser.parse({
    type: "function-assignment",
    name,
    params,
    rhs,
  });
  scope.set(name, node.evaluate(new Map(scope)));
};

const makeScope = (): Scope => {
  const scope: Scope = new Map([["a", 2.5]]);
  define(scope, "g", ["x", "y"], "\\sqrt{x^2 + y^2}");
  return scope;
};

const scalarField = (scope: Scope, rhs: string) =>
  latexParser
    .parse({
      type: "function-assignment",
      name: "_f",
      params: ["x", "y", "z"],
      rhs,
      validate: validators.realFunc[3][1],
    })
    .evaluate(new Map(scope)) as (x: number, y: number, z: number) => number;

const CELLS = 64;
const grid = new Float32Array((CELLS + 1) ** 3);

/** An implicit surface's update: `lhs - rhs` at every corner of the grid. */
const implicit = (lhsExpr: string, rhsExpr: string) => {
  const scope = makeScope();
  const lhs = scalarField(scope, lhsExpr);
  const rhs = scalarField(scope, rhsExpr);
  return () => {
    let c = 0;
    for (let k = 0; k <= CELLS; k += 1) {
      const z = -5 + (10 * k) / CELLS;
      for (let j = 0; j <= CELLS; j += 1) {
        const y = -5 + (10 * j) / CELLS;
        for (let i = 0; i <= CELLS; i += 1) {
          const x = -5 + (10 * i) / CELLS;
          grid[c] = lhs(x, y, z) - rhs(x, y, z);
          c += 1;
        }
      }
    }
  };
};

const SURFACE_SAMPLES = 256;

/** A parametric surface's update: a point per (u, v) sample. */
const surface = (rhs: string) => {
  const f = latexParser
    .parse({
      type: "function-assignment",
      name: "_f",
      params: ["u", "v"],
      rhs,
      validate: validators.realFunc[2][3],
    })
    .evaluate(new Map(makeScope())) as (u: number, v: number) => number[];
  const out = new Float32Array(3 * SURFACE_SAMPLES ** 2);
  return () => {
    let c = 0;
    for (let j = 0; j < SURFACE_SAMPLES; j += 1) {
      const v = (6 * j) / SURFACE_SAMPLES - 3;
      for (let i = 0; i < SURFACE_SAMPLES; i += 1) {
        const u = (6 * i) / SURFACE_SAMPLES - 3;
        const [x, y, z] = f(u, v);
        out[c] = x;
        out[c + 1] = y;
        out[c + 2] = z;
        c += 3;
      }
    }
  };
};

const options = { iterations: 10, time: 0, warmupIterations: 3, warmupTime: 0 };

describe(`implicit surface, ${CELLS} cells per axis`, () => {
  bench("sphere", implicit("x^2 + y^2 + z^2", "a"), options);
  bench("torus", implicit("(\\sqrt{x^2 + y^2} - a)^2 + z^2", "1"), options);
  bench(
    "gyroid",
    implicit("\\sin(a x)\\cos(y) + \\sin(y)\\cos(z) + \\sin(z)\\cos(x)", "0"),
    options,
  );
  bench(
    "torus via user function",
    implicit("(g(x, y) - a)^2 + z^2", "1"),
    options,
  );
  bench(
    "constant subexpression",
    implicit("x^2 + y^2 + z^2", "\\frac{\\sqrt{a^2 + 1}}{2 a} + \\sin(a)"),
    options,
  );
});

describe(`parametric surface, ${SURFACE_SAMPLES}×${SURFACE_SAMPLES}`, () => {
  bench(
    "helicoid",
    surface("\\left[v \\cos(u), v \\sin(u), a u\\right]"),
    options,
  );
  bench(
    "graph with a derivative",
    surface("\\left[u, v, diff(g, u, v) \\cdot [1, 1]\\right]"),
    options,
  );
});
