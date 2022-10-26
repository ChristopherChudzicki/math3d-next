import { AnonMathNode, EvaluationError } from "../MathScope";
import { MathNodeType } from "../MathScope/interfaces";
import { assertInstanceOf } from "../predicates";
import { IBatchError, IBatchErrorCtor } from "./interfaces";

class ArrayParseError extends Error implements IBatchError {
  itemErrors: IBatchError["itemErrors"];

  constructor(errors: IBatchError["itemErrors"]) {
    const [e] = Object.values(errors);
    super(e.message);
    this.itemErrors = errors;
  }
}

class ArrayEvaluationError extends EvaluationError implements IBatchError {
  itemErrors: Record<number, Error> = {};

  constructor(errors: IBatchError["itemErrors"]) {
    const [e] = Object.values(errors);
    super(e.message);
    this.itemErrors = errors;
  }
}

/**
 * Like Array.map, but does not bail early on errors. All errors are calculated
 * and grouped in a BatchError.
 */
const batch = <T, R, E extends IBatchErrorCtor>(
  items: T[],
  cb: (item: T, i: number, arr: T[]) => R,
  BatchError: E
): R[] => {
  const itemErrors: Record<number, Error> = {};
  const results = items.map((item, i, arr) => {
    try {
      return cb(item, i, arr);
    } catch (err) {
      assertInstanceOf(err, Error);
      itemErrors[i] = err;
      return undefined;
    }
  });
  if (Object.keys(itemErrors).length > 0) {
    throw new BatchError(itemErrors);
  }
  return results as R[];
};

const batchNodes = (nodes: AnonMathNode[]): AnonMathNode => {
  const evaluate: AnonMathNode["evaluate"] = (scope) => {
    return batch(nodes, (node) => node.evaluate(scope), ArrayEvaluationError);
  };
  const dependencies = new Set(nodes.flatMap((node) => [...node.dependencies]));

  return {
    type: MathNodeType.Value,
    evaluate,
    dependencies,
  };
};

const isBatchError = (error: unknown): error is IBatchError => {
  if (error instanceof ArrayParseError) return true;
  if (error instanceof ArrayEvaluationError) return true;
  return false;
};

export {
  batchNodes,
  batch,
  ArrayParseError,
  ArrayEvaluationError,
  isBatchError,
};
