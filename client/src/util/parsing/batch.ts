import * as mjs from "mathjs";
import { AnonMathNode, EvaluationError } from "../MathScope";
import { MathNodeType } from "../MathScope/interfaces";
import { assertInstanceOf } from "../predicates";
import { IBatchError, IBatchErrorCtor, ParseableObjs } from "./interfaces";

class ArrayParseError extends Error implements IBatchError {
  errors: IBatchError["errors"];

  constructor(errors: IBatchError["errors"]) {
    const [e] = Object.values(errors);
    super(e.message);
    this.errors = errors;
  }
}

class ArrayEvaluationError extends EvaluationError implements IBatchError {
  errors: Record<number, Error> = {};

  constructor(errors: IBatchError["errors"]) {
    const [e] = Object.values(errors);
    super(e.message);
    this.errors = errors;
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

const noOp = () => {};
const batchNodes = (
  nodes: AnonMathNode[],
  mjsNode: mjs.ArrayNode,
  validate: NonNullable<ParseableObjs["array"]["validate"]> = noOp
): AnonMathNode => {
  const evaluate: AnonMathNode["evaluate"] = (scope) => {
    const result = batch(
      nodes,
      (node) => node.evaluate(scope),
      ArrayEvaluationError
    );
    validate(result, mjsNode);
    return result;
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
