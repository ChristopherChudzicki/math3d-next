import math from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import type { EvaluationScope, AnonMathNode } from "@math3d/mathscope";
import { EvaluationError } from "@math3d/mathscope";
import invariant from "tiny-invariant";
import type { Validate } from "./interfaces";

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
  if (math.isMatrix(val)) {
    return val.toArray().map(numericTypeSimplify);
  }
  if (Array.isArray(val)) {
    return val.map(numericTypeSimplify);
  }
  if (math.isComplex(val)) {
    if (val.im < IM_ROUNDING_THRESHOLD) {
      return val.re;
    }
  }
  return val;
};

const identity = <T>(x: T): T => x;

const getValidatedEvaluate = (
  mjsNode: mjs.MathNode,
  validate: Validate = identity,
): AnonMathNode["evaluate"] => {
  const compiled = mjsNode.compile();
  const unvalidatedEvaluate = (scope?: EvaluationScope) => {
    const rawResult = compiled.evaluate(scope);
    if (typeof rawResult === "function") {
      const name =
        math.isAssignmentNode(mjsNode) || math.isFunctionAssignmentNode(mjsNode)
          ? mjsNode.name
          : "";
      const f = (...args: unknown[]) => {
        try {
          const rawEval = rawResult(...args);
          return numericTypeSimplify(rawEval);
        } catch (e) {
          if (!(e instanceof Error)) {
            throw new Error('Expected error to be an instance of "Error"');
          }
          throw new FunctionEvaluationError(name, e);
        }
      };
      const numArgs = math.isFunctionAssignmentNode(mjsNode)
        ? mjsNode.params.length
        : rawResult.length;
      Object.defineProperty(f, "length", { value: numArgs });
      return f;
    }
    return numericTypeSimplify(rawResult);
  };
  const evaluate = (scope?: EvaluationScope) => {
    try {
      const result = unvalidatedEvaluate(scope);
      return validate(result, mjsNode);
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

export { getValidatedEvaluate };
