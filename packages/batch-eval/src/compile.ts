import math, { mathWithTransform } from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import * as kernels from "./kernels";
import type { Kernel1, Kernel2 } from "./kernels";
import { createRepeats } from "./repeats";
import type { Compiled, Evaluate } from "./types";

type Fn = (...args: unknown[]) => unknown;

export type Scope = { has(name: string): boolean; get(name: string): unknown };

/** Thrown while compiling: the function gets no batched form. */
export class Unsupported extends Error {}

/** A subexpression that is the same number at every sample, or one that isn't. */
type NumberPart =
  | { constant: true; value: number }
  | {
      constant: false;
      evaluate: Evaluate;
      /**
       * The index of the one parameter it reads, or `SEVERAL`. A wrong value
       * makes reuse give wrong numbers, not an error.
       */
      reads: number;
      /** Whether it calls anything but `+ - * /`, unary `±` and whole powers. */
      calls: boolean;
    };

/** A vector-valued subexpression: one number per component. */
type VectorPart = { components: NumberPart[] };

type Part = NumberPart | VectorPart;

const SEVERAL = -1;

const isVector = (part: Part): part is VectorPart => "components" in part;

const number = (part: Part): NumberPart => {
  if (isVector(part)) throw new Unsupported();
  return part;
};

/** A value known when compiling: a number, or a flat vector of numbers. */
const constant = (value: unknown): Part => {
  if (typeof value === "number") return { constant: true, value };
  if (Array.isArray(value) && value.length > 0) {
    // `Array.from` visits a hole, which `map` would skip.
    return {
      components: Array.from(value, (entry) => number(constant(entry))),
    };
  }
  throw new Unsupported();
};

const toEvaluate = (part: NumberPart): Evaluate => {
  if (!part.constant) return part.evaluate;
  const { value } = part;
  return () => value;
};

const isFunction = (value: unknown): value is Fn => typeof value === "function";

const KERNELS_1 = new Map<unknown, Kernel1>([
  [mathWithTransform.unaryMinus, kernels.unaryMinus],
  [mathWithTransform.unaryPlus, kernels.unaryPlus],
]);
/**
 * Functions whose mathjs number implementation is the `Math` function, given
 * loops of their own.
 */
const MATH_KERNELS_1 = new Map<unknown, Kernel1>(
  Object.entries(kernels.MATH_KERNELS).map(([name, kernel]) => [
    mathWithTransform[name],
    kernel,
  ]),
);
const KERNELS_2 = new Map<unknown, Kernel2>([
  [mathWithTransform.add, kernels.add],
  [mathWithTransform.subtract, kernels.subtract],
  [mathWithTransform.multiply, kernels.multiply],
  [mathWithTransform.divide, kernels.divide],
]);

type VectorShapes = {
  numberVector?: true;
  vectorNumber?: true;
  vectorVector?: true;
};
/**
 * The operand shapes for which an operator works entry by entry, each entry
 * as the same operator on numbers. As `fastCompile`'s `VECTOR_SHAPES`: mathjs
 * takes vector × vector as a dot product and divides by a vector's matrix
 * inverse.
 */
const VECTOR_SHAPES = new Map<unknown, VectorShapes>([
  [
    mathWithTransform.add,
    { numberVector: true, vectorNumber: true, vectorVector: true },
  ],
  [
    mathWithTransform.subtract,
    { numberVector: true, vectorNumber: true, vectorVector: true },
  ],
  [mathWithTransform.multiply, { numberVector: true, vectorNumber: true }],
  [mathWithTransform.divide, { vectorNumber: true }],
]);

/** `inner` over the columns `operands` give. */
const applying =
  (inner: Evaluate, operands: Evaluate[]): Evaluate =>
  (count, args, pool) =>
    inner(
      count,
      operands.map((operand) => operand(count, args, pool)),
      pool,
    );

const call1 =
  (kernel: Kernel1, a: Evaluate): Evaluate =>
  (count, args, pool) =>
    kernel(count, a(count, args, pool), pool);

/**
 * Compiles `f(params) = body` into batch kernels, reading scope values now.
 * `compiledOf` gives the compiled form of a function value that has one.
 * Throws `Unsupported` for anything but numbers and flat vectors of them.
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

  const repeats = createRepeats(params.length);

  /**
   * `part`, evaluated once per period entry or run of its parameter's column,
   * when it reads one parameter of several and makes a call. Sound only while
   * a function gives the same number for the same input.
   */
  const reuseRepeats = (part: NumberPart): NumberPart => {
    if (part.constant || !part.calls || part.reads === SEVERAL) return part;
    if (params.length < 2) return part;
    return {
      ...part,
      evaluate: repeats.oncePerRepeat(part.evaluate, part.reads),
    };
  };

  /** How `fn` runs over `operands`, and whether that is arithmetic alone. */
  const kernelOf = (
    fn: Fn,
    operands: NumberPart[],
  ): { evaluate: Evaluate; arithmetic: boolean } => {
    const evaluates = operands.map(toEvaluate);
    if (operands.length === 1) {
      const arithmetic = KERNELS_1.get(fn);
      const kernel = arithmetic ?? MATH_KERNELS_1.get(fn);
      if (kernel) {
        return {
          arithmetic: arithmetic !== undefined,
          evaluate: call1(kernel, evaluates[0]),
        };
      }
    }
    if (operands.length === 2) {
      const [a, b] = evaluates;
      const kernel = KERNELS_2.get(fn);
      if (kernel) {
        return {
          arithmetic: true,
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
          arithmetic: true,
          evaluate: call1(kernels.powInt(exponent.value), a),
        };
      }
    }
    return {
      arithmetic: false,
      evaluate: applying(kernels.generic(fn, operands.length), evaluates),
    };
  };

  /**
   * `fn` of numbers: a vector when it folds to one or `fn` has a vector form,
   * else a number, declining where `fn` gives anything else.
   */
  const numberCall = (fn: Fn, operands: NumberPart[]): Part => {
    if (operands.every((operand) => operand.constant)) {
      let value: unknown;
      try {
        value = fn(...operands.map((operand) => operand.value));
      } catch {
        throw new Unsupported();
      }
      return constant(value);
    }
    const varying = operands.filter((operand) => !operand.constant);
    const reads = varying.every((operand) => operand.reads === varying[0].reads)
      ? varying[0].reads
      : SEVERAL;
    // An operand that reads one parameter where the call reads several is a
    // maximal subexpression of one parameter.
    const reused = reads === SEVERAL ? operands.map(reuseRepeats) : operands;
    const inner = compiledOf(fn);
    if (inner && inner.params === operands.length) {
      const evaluates = reused.map(toEvaluate);
      const components = inner.components.map(
        (component): NumberPart => ({
          constant: false,
          evaluate: applying(component, evaluates),
          reads,
          calls: true,
        }),
      );
      return inner.vector ? { components } : components[0];
    }
    const { evaluate, arithmetic } = kernelOf(fn, reused);
    return {
      constant: false,
      evaluate,
      reads,
      calls: !arithmetic || varying.some((operand) => operand.calls),
    };
  };

  /** `fn` of two operands, at least one a vector, entry by entry. */
  const entrywise = (fn: Fn, operands: Part[]): VectorPart => {
    const shapes = VECTOR_SHAPES.get(fn);
    if (!shapes || operands.length !== 2) throw new Unsupported();
    const [a, b] = operands;
    const each = (x: NumberPart, y: NumberPart) =>
      number(numberCall(fn, [x, y]));
    if (!isVector(a)) {
      if (!isVector(b) || !shapes.numberVector) throw new Unsupported();
      return { components: b.components.map((y) => each(a, y)) };
    }
    if (!isVector(b)) {
      if (!shapes.vectorNumber) throw new Unsupported();
      return { components: a.components.map((x) => each(x, b)) };
    }
    // mathjs broadcasts a one-entry vector, so sizes must match.
    if (!shapes.vectorVector || a.components.length !== b.components.length) {
      throw new Unsupported();
    }
    return {
      components: a.components.map((x, k) => each(x, b.components[k])),
    };
  };

  const call = (fn: Fn, operands: Part[]): Part =>
    operands.some(isVector)
      ? entrywise(fn, operands)
      : numberCall(fn, operands.map(number));

  const build = (expr: mjs.MathNode): Part => {
    if (math.isConstantNode(expr)) return constant(expr.value);
    if (math.isParenthesisNode(expr)) return build(expr.content);
    if (math.isSymbolNode(expr)) {
      const index = params.indexOf(expr.name);
      if (index < 0) return constant(lookup(expr.name));
      return {
        constant: false,
        evaluate: (_count, args) => args[index],
        reads: index,
        calls: false,
      };
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
    if (math.isArrayNode(expr)) {
      if (expr.items.length === 0) throw new Unsupported();
      return { components: expr.items.map(build).map(number) };
    }
    throw new Unsupported();
  };

  const body = build(node.expr);
  const vector = isVector(body);
  // As `createRepeats` requires, every `oncePerRepeat` precedes the first
  // `inspecting`.
  const components = (vector ? body.components : [body])
    .map(reuseRepeats)
    .map(toEvaluate);
  return {
    params: params.length,
    vector,
    components: components.map(repeats.inspecting),
  };
};
