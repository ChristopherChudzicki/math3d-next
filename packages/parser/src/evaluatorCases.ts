type FunctionCase = {
  title: string;
  /** A function assignment, in mathjs's syntax. */
  expr: string;
  /** Arguments to call the function with. */
  point: unknown[];
  scope?: Record<string, unknown>;
  /** Whether fastCompile evaluates it without handing it to mathjs. */
  fast: boolean;
  /** Whether it gets a batched form. */
  batches: boolean;
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
    title: "a vector written out",
    expr: "f(x) = [1, 2, 3] x",
    point: [0.5],
    fast: true,
    batches: false,
  },
  {
    title: "a scope value that isn't a number",
    expr: "f(x) = x i + v",
    point: [0.5],
    scope: { v: [1, 0, 0] },
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
