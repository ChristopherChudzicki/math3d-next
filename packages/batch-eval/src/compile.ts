import math, { mathWithTransform } from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import * as kernels from "./kernels";
import type { Kernel1, Kernel2 } from "./kernels";
import type { Compiled, Evaluate } from "./types";

type Fn = (...args: unknown[]) => unknown;

export type Scope = { has(name: string): boolean; get(name: string): unknown };

/** Thrown while compiling: the function gets no batched form. */
export class Unsupported extends Error {}

/** A subexpression that is the same number at every sample, or one that isn't. */
type Part =
  | { constant: true; value: number }
  | { constant: false; evaluate: Evaluate };

const constant = (value: unknown): Part => {
  if (typeof value !== "number") throw new Unsupported();
  return { constant: true, value };
};

const toEvaluate = (part: Part): Evaluate => {
  if (!part.constant) return part.evaluate;
  const { value } = part;
  return () => value;
};

const isFunction = (value: unknown): value is Fn => typeof value === "function";

const KERNELS_1 = new Map<unknown, Kernel1>([
  [mathWithTransform.unaryMinus, kernels.unaryMinus],
  [mathWithTransform.unaryPlus, kernels.unaryPlus],
]);
/** The functions whose mathjs number implementation is the `Math` function. */
const MATH_KERNELS_1 = new Map<unknown, Kernel1>([
  [mathWithTransform.sin, kernels.sin],
  [mathWithTransform.cos, kernels.cos],
  [mathWithTransform.tan, kernels.tan],
  [mathWithTransform.atan, kernels.atan],
  [mathWithTransform.sinh, kernels.sinh],
  [mathWithTransform.cosh, kernels.cosh],
  [mathWithTransform.tanh, kernels.tanh],
  [mathWithTransform.exp, kernels.exp],
  [mathWithTransform.abs, kernels.abs],
]);
const KERNELS_2 = new Map<unknown, Kernel2>([
  [mathWithTransform.add, kernels.add],
  [mathWithTransform.subtract, kernels.subtract],
  [mathWithTransform.multiply, kernels.multiply],
  [mathWithTransform.divide, kernels.divide],
]);

const call1 =
  (kernel: Kernel1, a: Evaluate): Evaluate =>
  (count, args, pool) =>
    kernel(count, a(count, args, pool), pool);

/**
 * Compiles `f(params) = body` into batch kernels, reading scope values now.
 * `compiledOf` gives the compiled form of a function value that has one.
 * Throws `Unsupported` for anything but numbers.
 *
 * Only for a function `fastCompile` built from `node`. What it hands to
 * mathjs, such as a function that calls itself or a parameter called as a
 * function, is not rejected here and would compile to the wrong thing.
 */
export const compile = (
  node: mjs.FunctionAssignmentNode,
  scope: Scope,
  compiledOf: (value: unknown) => Compiled | undefined,
): Compiled => {
  const { params } = node;

  /** What `name` means outside the parameters: the scope's value, else mathjs's. */
  const lookup = (name: string): unknown => {
    if (scope.has(name)) return scope.get(name);
    if (Object.hasOwn(mathWithTransform, name)) return mathWithTransform[name];
    throw new Unsupported();
  };

  const call = (fn: Fn, operands: Part[]): Part => {
    if (operands.every((operand) => operand.constant)) {
      let value: unknown;
      try {
        value = fn(...operands.map((operand) => operand.value));
      } catch {
        throw new Unsupported();
      }
      return constant(value);
    }
    const evaluates = operands.map(toEvaluate);
    const inner = compiledOf(fn);
    if (inner && inner.params === operands.length) {
      return {
        constant: false,
        evaluate: (count, args, pool) =>
          inner.evaluate(
            count,
            evaluates.map((operand) => operand(count, args, pool)),
            pool,
          ),
      };
    }
    if (operands.length === 1) {
      const kernel = KERNELS_1.get(fn) ?? MATH_KERNELS_1.get(fn);
      if (kernel) {
        return { constant: false, evaluate: call1(kernel, evaluates[0]) };
      }
    }
    if (operands.length === 2) {
      const [a, b] = evaluates;
      const kernel = KERNELS_2.get(fn);
      if (kernel) {
        return {
          constant: false,
          evaluate: (count, args, pool) =>
            kernel(count, a(count, args, pool), b(count, args, pool), pool),
        };
      }
      const [, exponent] = operands;
      if (
        fn === mathWithTransform.pow &&
        exponent.constant &&
        Number.isInteger(exponent.value)
      ) {
        return {
          constant: false,
          evaluate: call1(kernels.powInt(exponent.value), a),
        };
      }
    }
    const kernel = kernels.generic(fn, operands.length);
    return {
      constant: false,
      evaluate: (count, args, pool) =>
        kernel(
          count,
          evaluates.map((operand) => operand(count, args, pool)),
          pool,
        ),
    };
  };

  const build = (expr: mjs.MathNode): Part => {
    if (math.isConstantNode(expr)) return constant(expr.value);
    if (math.isParenthesisNode(expr)) return build(expr.content);
    if (math.isSymbolNode(expr)) {
      const index = params.indexOf(expr.name);
      if (index < 0) return constant(lookup(expr.name));
      return { constant: false, evaluate: (_count, args) => args[index] };
    }
    if (math.isOperatorNode(expr)) {
      // Operators come from mathjs, never the scope.
      const fn = Object.hasOwn(mathWithTransform, expr.fn)
        ? mathWithTransform[expr.fn]
        : undefined;
      if (!isFunction(fn)) throw new Unsupported();
      return call(fn, expr.args.map(build));
    }
    if (math.isFunctionNode(expr)) {
      if (!math.isSymbolNode(expr.fn)) throw new Unsupported();
      const fn = lookup(expr.fn.name);
      if (!isFunction(fn)) throw new Unsupported();
      return call(fn, expr.args.map(build));
    }
    throw new Unsupported();
  };

  return { params: params.length, evaluate: toEvaluate(build(node.expr)) };
};
