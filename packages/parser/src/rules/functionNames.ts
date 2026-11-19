type Arity = "one" | "many";

const trig = ["sin", "cos", "tan", "csc", "sec", "cot"];
const trigFamily = [
  ...trig,
  ...trig.map((n) => `arc${n}`),
  ...trig.map((n) => `${n}h`),
  ...trig.map((n) => `arc${n}h`),
];

/**
 * Built-in functions that the math field produces as a command (`\sin`,
 * `\operatorname{abs}`). A one-argument name applies to the factor after it:
 * `\sin x` is `sin(x)`.
 */
const FUNCTION_ARITY: Readonly<Record<string, Arity>> = {
  ...Object.fromEntries(trigFamily.map((n) => [n, "one" as const])),
  exp: "one",
  ln: "one",
  log: "one",
  abs: "one",
  norm: "one",
  sign: "one",
  floor: "one",
  ceil: "one",
  arg: "one",
  sum: "one",
  mean: "one",
  ones: "one",
  grad: "one",
  curl: "one",
  div: "one",
  root: "many",
  unitT: "many",
  unitN: "many",
  unitB: "many",
  max: "many",
  min: "many",
  lcm: "many",
  dotMultiply: "many",
};

const functionArity = (name: string): Arity | undefined =>
  Object.hasOwn(FUNCTION_ARITY, name) ? FUNCTION_ARITY[name] : undefined;

export { FUNCTION_ARITY, functionArity };
export type { Arity };
