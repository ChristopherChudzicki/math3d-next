type FunctionCase = {
  title: string;
  /** A function assignment, in mathjs's syntax. */
  expr: string;
  /** Arguments to call the function with. */
  point: unknown[];
  scope?: Record<string, unknown>;
  /** Whether fastCompile evaluates it without handing it to mathjs. */
  fast: boolean;
  /** `true` for a number form, `"vector"` for a vector form, `false` for none. */
  batches: boolean | "vector";
  /** Whether the batched form declines at `point`. */
  declines?: true;
};

/** Functions every evaluator must agree with mathjs on. */
export const functionCases: FunctionCase[] = [
  {
    title: "arithmetic",
    expr: "f(x, y, z) = x^2 + y z - x / y + (-z)",
    point: [1, 2, 3],
    fast: true,
    batches: true,
  },
  {
    title: "whole-number exponents",
    expr: "f(x) = x^2 + x^(-3)",
    point: [-1.5],
    fast: true,
    batches: true,
  },
  {
    title: "a whole-number exponent of a complex number",
    expr: "f(x) = (x i)^2",
    point: [-1.5],
    fast: true,
    batches: false,
  },
  {
    title: "a fractional exponent of a negative number",
    expr: "f(x) = x^0.5",
    point: [-4],
    fast: true,
    batches: true,
    declines: true,
  },
  {
    title: "a negative base to 1/3",
    expr: "f(x) = x^(1/3)",
    point: [-8],
    fast: true,
    batches: true,
  },
  {
    title: "a scope value and a constant",
    expr: "f(x) = a x + pi",
    point: [0.5],
    scope: { a: 2.5 },
    fast: true,
    batches: true,
  },
  {
    title: "a vector written out, times a number",
    expr: "f(x) = [1, 2, 3] x",
    point: [0.5],
    fast: true,
    batches: "vector",
  },
  {
    title: "a number plus a scope vector",
    expr: "f(x) = x + v",
    point: [0.5],
    scope: { v: [1, 0, 0] },
    fast: true,
    batches: "vector",
  },
  {
    title: "a vector minus a vector",
    expr: "f(u, v) = [u, v, u * v] - [v, u, 1]",
    point: [0.5, -2],
    fast: true,
    batches: "vector",
  },
  {
    title: "a vector over a number, plus a number",
    expr: "f(u, v) = [u, v, 1] / v + 2",
    point: [0.5, -2],
    fast: true,
    batches: "vector",
  },
  {
    title: "a number minus a vector times a number",
    expr: "f(u, v) = v - [u, 0, 1] * u",
    point: [0.5, -2],
    fast: true,
    batches: "vector",
  },
  {
    title: "a vector minus a number",
    expr: "f(u, v) = [u, v, 1] - v",
    point: [0.5, -2],
    fast: true,
    batches: "vector",
  },
  {
    title: "a vector with a complex component",
    expr: "f(u) = [u, u^0.5, 0]",
    point: [-4],
    fast: true,
    batches: "vector",
    declines: true,
  },
  {
    // A limit, not a goal: the function gives a value.
    title: "vectors of different sizes",
    expr: "f(u, v) = [u] + [u, v, 0]",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // A limit, not a goal: the function gives a value.
    title: "a vector times a vector",
    expr: "f(u, v) = [u, v, 0] * [v, u, 1]",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // mathjs throws.
    title: "a number over a vector",
    expr: "f(u, v) = 2 / [u, v, 1]",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // mathjs throws.
    title: "a vector over a vector",
    expr: "f(u, v) = [u, v, 1] / [u, v, 1]",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // mathjs throws.
    title: "a power of a vector",
    expr: "f(u, v) = [u, v, 0]^2",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // A limit, not a goal: mathjs leaves a zero entry's sign alone, so the
    // number kernel on each entry doesn't match.
    title: "a negated vector",
    expr: "f(u, v) = -[u, v, 0]",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // mathjs throws.
    title: "a function of a vector",
    expr: "f(u, v) = sin([u, v, 0])",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // A limit, not a goal: the function gives a value.
    title: "a matrix written out",
    expr: "f(u, v) = [[u, v], [v, u]]",
    point: [0.5, -2],
    fast: true,
    batches: false,
  },
  {
    // A limit, not a goal: the function gives a value.
    title: "an empty scope vector",
    expr: "f(u) = u + e",
    point: [0.5],
    scope: { e: [] },
    fast: true,
    batches: false,
  },
  {
    // A limit, not a goal: the function gives a value.
    title: "a scope matrix",
    expr: "f(u) = u + m",
    point: [0.5],
    scope: {
      m: [
        [1, 0],
        [0, 1],
      ],
    },
    fast: true,
    batches: false,
  },
  {
    title: "a call with three arguments",
    expr: "f(x) = max(x, 1, 2)",
    point: [-8],
    fast: true,
    batches: true,
  },
  {
    title: "a call with a vector argument",
    expr: "f(x) = norm([x, 1])",
    point: [-8],
    fast: true,
    batches: false,
  },
  {
    title: "a scope function named as mathjs's",
    expr: "f(x) = sin(x)",
    point: [0.5],
    scope: { sin: (x: number) => 10 * x },
    fast: true,
    batches: true,
  },
  {
    title: "a scope value named as an operator's function",
    expr: "f(x) = x + 1",
    point: [0.5],
    scope: { add: () => 0 },
    fast: true,
    batches: true,
  },
  {
    title: "a parameter named as a scope value",
    expr: "f(x) = x + 1",
    point: [0.5],
    scope: { x: 100 },
    fast: true,
    batches: true,
  },
  {
    title: "a scope value called though it is no function",
    expr: "f(x) = x + a(x)",
    point: [0.5],
    scope: { a: 2.5 },
    fast: false,
    batches: false,
  },
  {
    title: "a node type it doesn't handle",
    expr: "f(x) = x > 0 ? 1 : 2",
    point: [1],
    fast: false,
    batches: false,
  },
  {
    title: "a parameter called as a function",
    expr: "f(sin, x) = sin(x)",
    point: [Math.cos, 0],
    fast: false,
    batches: false,
  },
  {
    title: "more parameters than a closure has slots",
    expr: "f(a, b, c, d, e, g) = a + b + c + d + e + g",
    point: [1, 2, 3, 4, 5, 6],
    fast: false,
    batches: false,
  },
  {
    title: "an undefined name",
    expr: "f(x) = x + undefinedName",
    point: [1],
    fast: false,
    batches: false,
  },
  {
    title: "a parameter named as an Object.prototype property",
    expr: "f(toString) = toString + 1",
    point: [1],
    fast: false,
    batches: false,
  },
  {
    // The scope's `f` is an earlier definition, not the one being defined.
    title: "a function that calls itself",
    expr: "f(x) = f(x) + 1",
    point: [1],
    scope: { f: () => 5 },
    fast: false,
    batches: false,
  },
];
