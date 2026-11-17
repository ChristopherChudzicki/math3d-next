import math, {
  getUserFunctionSignature,
  setUserFunctionSignature,
  spreadPoint,
} from "@math3d/custom-mathjs";
import type { UserFunctionSignature } from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import type { AnonMathNode } from "@math3d/mathscope";
import { EvaluationError } from "@math3d/mathscope";
import invariant from "tiny-invariant";
import type { ParseValidate } from "./interfaces";
import { fastCompile, numbersOf } from "./fastCompile";
import { isModOne } from "./outerMod";

class FunctionEvaluationError extends EvaluationError {
  innerError: Error;

  funcName: string;

  static getErrors(
    name: string,
    error: Error,
  ): { name: string; error: Error }[] {
    const namedErrors: { error: Error; name: string }[] = [{ name, error }];
    let e = error;
    while (e instanceof FunctionEvaluationError) {
      namedErrors.push({ name: e.funcName, error: e.innerError });
      e = e.innerError;
    }
    namedErrors.reverse();
    return namedErrors;
  }

  constructor(name: string, error: Error) {
    const namedErrors = FunctionEvaluationError.getErrors(name, error);
    const message = name.startsWith("_")
      ? namedErrors[0].error.message
      : `Error evaluating ${namedErrors[0].name}: ${namedErrors[0].error.message}.`;
    super(message);
    this.innerError = error;
    this.funcName = name;
  }
}

const IM_ROUNDING_THRESHOLD = 1e-10;
const numericTypeSimplify = (val: unknown): unknown => {
  // A vector of numbers, the usual sample, has nothing to simplify. Copied,
  // since `numbersOf` returns the operand's own array.
  const numbers = numbersOf(val);
  if (numbers) return numbers.slice();
  if (math.isMatrix(val)) {
    return val.toArray().map(numericTypeSimplify);
  }
  if (Array.isArray(val)) {
    return val.map(numericTypeSimplify);
  }
  if (math.isComplex(val)) {
    if (Math.abs(val.im) < IM_ROUNDING_THRESHOLD) {
      return val.re;
    }
  }
  return val;
};

const identity = <T>(x: T): T => x;

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

const shape = (x: unknown): number[] => {
  const dims: number[] = [];
  let entry = math.isMatrix(x) ? x.toArray() : x;
  while (Array.isArray(entry)) {
    dims.push(entry.length);
    [entry] = entry;
  }
  return dims;
};

/** Why the user function can't take `args`, which spread to `spread`. */
const arityError = (
  { name, params }: UserFunctionSignature,
  args: unknown[],
  spread: unknown[],
): string | undefined => {
  const n = params.length;
  if (spread.length === n) return undefined;
  const needs = `${name}(${params.join(", ")}) needs ${count(n, "input")}`;
  if (n >= 2 && args.length === 1) {
    const dims = shape(args[0]);
    if (dims.length === 1) {
      return `${needs}, but got a vector with ${count(dims[0], "component")}`;
    }
    if (dims.length > 1) return `${needs}, but got a ${dims.join("×")} matrix`;
  }
  const point = n >= 2 ? `, or one point [${params.join(", ")}]` : "";
  return `${needs}${point}, but got ${args.length}`;
};

/**
 * Wraps an item's function value. A function assignment is marked as a user
 * function; an alias carries its target's mark.
 */
const wrapFunction = (
  mjsNode: mjs.MathNode,
  rawResult: (...args: unknown[]) => unknown,
) => {
  const name =
    math.isAssignmentNode(mjsNode) || math.isFunctionAssignmentNode(mjsNode)
      ? mjsNode.name
      : "";
  const own = math.isFunctionAssignmentNode(mjsNode)
    ? { name, params: mjsNode.params }
    : undefined;
  const signature = own ?? getUserFunctionSignature(rawResult);
  const f = (...args: unknown[]) => {
    try {
      let spread = args;
      // Matching arity: nothing to spread or reject.
      if (own && args.length !== own.params.length) {
        spread = spreadPoint(f, args);
        const error = arityError(own, args, spread);
        if (error) throw new Error(error);
      }
      const rawEval = rawResult(...spread);
      return typeof rawEval === "number"
        ? rawEval
        : numericTypeSimplify(rawEval);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new Error('Expected error to be an instance of "Error"');
      }
      throw new FunctionEvaluationError(name, e);
    }
  };
  if (signature) setUserFunctionSignature(f, signature);
  Object.defineProperty(f, "length", {
    value: own ? own.params.length : rawResult.length,
  });
  return f;
};

type AnyFunction = (...args: never[]) => unknown;

const wrapping = new WeakSet<object>();

/**
 * Whether `f` was evaluated from `f(…) = mod(g, 1)` with mathjs's own `mod`,
 * so its values wrap at 1: 0.99 is near 0.01.
 */
const wrapsAtOne = (f: AnyFunction): boolean => wrapping.has(f);

const getValidatedEvaluate = (
  mjsNode: mjs.MathNode,
  validate: ParseValidate = identity,
): AnonMathNode["evaluate"] => {
  const compiled = fastCompile(mjsNode);
  const modOne =
    math.isFunctionAssignmentNode(mjsNode) &&
    !mjsNode.params.includes("mod") &&
    isModOne(mjsNode.expr);
  const unvalidatedEvaluate: AnonMathNode["evaluate"] = (scope) => {
    const rawResult = compiled.evaluate(scope);
    if (typeof rawResult === "function") {
      return wrapFunction(mjsNode, rawResult);
    }
    return numericTypeSimplify(rawResult);
  };
  const evaluate: AnonMathNode["evaluate"] = (scope) => {
    try {
      const result = validate(unvalidatedEvaluate(scope), mjsNode);
      // A scope with its own `mod` gives the call another meaning.
      if (modOne && typeof result === "function" && !scope?.has("mod")) {
        wrapping.add(result);
      }
      return result;
    } catch (err) {
      invariant(err instanceof Error);
      if (err instanceof EvaluationError) {
        throw err;
      }
      // eslint-disable-next-line no-console
      console.warn(err);
      throw new EvaluationError(err.message);
    }
  };
  return evaluate;
};

export { getValidatedEvaluate, wrapsAtOne };
