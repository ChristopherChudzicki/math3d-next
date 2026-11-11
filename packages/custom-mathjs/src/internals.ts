import math from "./mathjs";

type Internals = {
  expression: { mathWithTransform: Record<string, unknown> };
  typed: {
    isTypedFunction(f: unknown): boolean;
    /** The signature of `f` that a call with `args` runs, if any. */
    resolve(
      f: unknown,
      args: unknown[],
    ): { implementation: (...args: unknown[]) => unknown } | null;
  };
};

const { expression, typed } = math as unknown as Internals;

/**
 * Everything an expression can name: the instance's functions and constants,
 * with the variants (transforms) that expressions call. mathjs's types omit it.
 */
const { mathWithTransform } = expression;

export { mathWithTransform, typed };
