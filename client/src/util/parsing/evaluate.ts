import * as math from "mathjs";
import type { EvaluationScope, AnonMathNode } from "@/util/MathScope";
import { EvaluationError } from "@/util/MathScope";
import { isNotNil, assertInstanceOf } from "../predicates";
import type { Validate } from "./interfaces";

class ArrayEvaluationError extends EvaluationError {
  itemErrors: Record<number, Error> = {};

  constructor(message: string, itemErrors: Record<number, Error>) {
    super(message);
    this.itemErrors = itemErrors;
  }
}

class FunctionEvaluationError extends EvaluationError {
  innerError: Error;

  funcName: string;

  static getErrors(
    name: string,
    error: Error
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
    const message = `Error evaluating ${namedErrors[0].name}: ${namedErrors[0].error.message}.`;
    super(message);
    this.innerError = error;
    this.funcName = name;
  }
}

const evalArray = (
  parsed: math.ArrayNode,
  compileNode: math.EvalFunction,
  scope?: EvaluationScope
) => {
  try {
    return compileNode.evaluate(scope);
  } catch (err) {
    const items = parsed.items
      .map((item, i) => {
        try {
          item.evaluate(scope);
          return null;
        } catch (itemErr) {
          if (!(itemErr instanceof Error)) {
            throw new Error("Unexpected error type");
          }
          return [i, itemErr] as const;
        }
      })
      .filter(isNotNil);
    const itemErrors = Object.fromEntries(items);
    const firstError = items[0][1];
    throw new ArrayEvaluationError(firstError.message, itemErrors);
  }
};

const getValidatedEvaluate = (
  mjsNode: math.MathNode,
  validate: Validate = () => {}
): AnonMathNode["evaluate"] => {
  const compiled = mjsNode.compile();
  const unvalidatedEvaluate = (scope?: EvaluationScope) => {
    const rawResult =
      mjsNode instanceof math.ArrayNode
        ? evalArray(mjsNode, compiled, scope)
        : compiled.evaluate(scope);
    if (math.isMatrix(rawResult)) {
      return rawResult.toArray();
    }
    if (typeof rawResult === "function") {
      const name =
        mjsNode.type === "AssignmentNode" ||
        mjsNode.type === "FunctionAssignmentNode"
          ? mjsNode.name
          : "";
      const f = (...args: unknown[]) => {
        try {
          const rawEval = rawResult(...args);
          return math.isMatrix(rawEval) ? rawEval.toArray() : rawEval;
        } catch (e) {
          if (!(e instanceof Error)) {
            throw new Error('Expected error to be an instance of "Error"');
          }
          throw new FunctionEvaluationError(name, e);
        }
      };
      const numArgs =
        mjsNode.type === "FunctionAssignmentNode"
          ? mjsNode.params.length
          : rawResult.length;
      Object.defineProperty(f, "length", { value: numArgs });
      return f;
    }
    return rawResult;
  };
  const evaluate = (scope?: EvaluationScope) => {
    try {
      const result = unvalidatedEvaluate(scope);
      validate(result, mjsNode);
      return result;
    } catch (err) {
      assertInstanceOf(err, Error);
      if (err instanceof EvaluationError) {
        throw err;
      }
      throw new EvaluationError(err.message);
    }
  };
  return evaluate;
};

export { getValidatedEvaluate };
