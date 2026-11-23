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

const constant = (value: number): NumberPart => ({ constant: true, value });

/** A value known when compiling: a number, or a flat vector of numbers. */
const constantOf = (value: unknown): Part => {
  if (typeof value === "number") return constant(value);
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "number")
  ) {
    return { components: value.map((entry: number) => constant(entry)) };
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
 * The operand shapes for which an operator works entry by entry on vectors,
 * each entry as the same operator on numbers. They are the shapes
 * `fastCompile` computes that way; mathjs treats every other as something
 * else (vector × vector is a dot product).
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

  /** How a call runs over its operands, and whether that is arithmetic alone. */
  type Kernel = { evaluate: Evaluate; arithmetic: boolean };

  const kernelOf = (fn: Fn, operands: NumberPart[]): Kernel => {
    const evaluates = operands.map(toEvaluate);
    const inner = compiledOf(fn);
    if (inner && "evaluate" in inner && inner.params === operands.length) {
      return {
        arithmetic: false,
        evaluate: applying(inner.evaluate, evaluates),
      };
    }
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
    const kernel = kernels.generic(fn, operands.length);
    return {
      arithmetic: false,
      evaluate: (count, args, pool) =>
        kernel(
          count,
          evaluates.map((operand) => operand(count, args, pool)),
          pool,
        ),
    };
  };

  /** The value `kernel` computes from `operands`, at least one of which varies. */
  const combine = (
    operands: NumberPart[],
    kernel: (operands: NumberPart[]) => Kernel,
  ): NumberPart => {
    const varying = operands.filter((operand) => !operand.constant);
    const reads = varying.every((operand) => operand.reads === varying[0].reads)
      ? varying[0].reads
      : SEVERAL;
    // An operand that reads one parameter where the call reads several is a
    // maximal subexpression of one parameter.
    const { evaluate, arithmetic } = kernel(
      reads === SEVERAL ? operands.map(reuseRepeats) : operands,
    );
    return {
      constant: false,
      evaluate,
      reads,
      calls: !arithmetic || varying.some((operand) => operand.calls),
    };
  };

  /** `fn` of numbers: a number, or a vector when `fn` returns one. */
  const numberCall = (fn: Fn, operands: NumberPart[]): Part => {
    if (operands.every((operand) => operand.constant)) {
      let value: unknown;
      try {
        value = fn(...operands.map((operand) => operand.value));
      } catch {
        throw new Unsupported();
      }
      return constantOf(value);
    }
    const inner = compiledOf(fn);
    if (inner && "components" in inner && inner.params === operands.length) {
      return {
        components: inner.components.map((component) =>
          combine(operands, (parts) => ({
            arithmetic: false,
            evaluate: applying(component, parts.map(toEvaluate)),
          })),
        ),
      };
    }
    return combine(operands, (parts) => kernelOf(fn, parts));
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

  const call = (fn: Fn, operands: Part[]): Part => {
    const numbers = operands.filter(
      (operand): operand is NumberPart => !isVector(operand),
    );
    return numbers.length < operands.length
      ? entrywise(fn, operands)
      : numberCall(fn, numbers);
  };

  const build = (expr: mjs.MathNode): Part => {
    if (math.isConstantNode(expr)) return constantOf(expr.value);
    if (math.isParenthesisNode(expr)) return build(expr.content);
    if (math.isSymbolNode(expr)) {
      const index = params.indexOf(expr.name);
      if (index < 0) return constantOf(lookup(expr.name));
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
  if (isVector(body)) {
    // Every `oncePerRepeat` comes before the first `inspecting`.
    const components = body.components.map(reuseRepeats).map(toEvaluate);
    return {
      params: params.length,
      components: components.map(repeats.inspecting),
    };
  }
  const evaluate = toEvaluate(reuseRepeats(body));
  return { params: params.length, evaluate: repeats.inspecting(evaluate) };
};
