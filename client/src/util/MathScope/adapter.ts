import * as math from "mathjs";
import { assertInstanceOf, isNotNil } from "../predicates";

import type {
  AnonMathNode,
  AnonParse,
  Evaluatable,
  EvaluationScope,
  MathNode,
  Parse,
} from "./interfaces";
import { MathNodeType } from "./interfaces";
import { EvaluationError } from "./Evaluator";

window.math = math;

const getDependencies = (
  node: math.MathNode,
  omit: Set<string> = new Set([])
): Set<string> => {
  if (node instanceof math.AssignmentNode) return getDependencies(node.value);
  if (node instanceof math.FunctionAssignmentNode) {
    return getDependencies(node.expr, new Set(node.params));
  }
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (n instanceof math.SymbolNode && !omit.has(n.name)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

interface ParseOptions {
  validate?: (evaluated: unknown, parsed: math.MathNode) => void;
}

const defaultParseOptions: Required<ParseOptions> = {
  validate: () => {},
};

class ArrayEvaluationError extends EvaluationError {
  itemErrors: Record<number, Error> = {};

  constructor(message: string, itemErrors: Record<number, Error>) {
    super(message);
    this.itemErrors = itemErrors;
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

const compileNode = (
  mjsNode: math.MathNode,
  options: ParseOptions
): Evaluatable => {
  const compiled = mjsNode.compile();
  const { validate = defaultParseOptions.validate } = {
    ...options,
  };
  const unvalidatedEvaluate = (scope?: EvaluationScope) => {
    const rawResult =
      mjsNode instanceof math.ArrayNode
        ? evalArray(mjsNode, compiled, scope)
        : compiled.evaluate(scope);
    if (math.isMatrix(rawResult)) {
      return rawResult.toArray();
    }
    if (typeof rawResult === "function") {
      const f = (...args: unknown[]) => {
        const evaluated = rawResult(...args);
        return math.isMatrix(evaluated) ? evaluated.toArray() : evaluated;
      };
      const numArgs =
        mjsNode.type === "FunctionAssignmentNode"
          ? mjsNode.params.length
          : rawResult.length;
      Object.defineProperty(f, "length", { value: numArgs });
      /**
       * 1. First the node is evalauted... the result is a function F
       * 2. Subsequently (perhaps) the function F might be evaluated
       *
       * The point here is to check that if evaluating F would throw, then we
       * want to figure that out at step (1) not step (2). Determing a good
       * sample point seems...infeasible. But in general, if a point is
       * outside the domain of F, we expect F to return NaN not to throw.
       */
      const sample = Array(f.length)
        .fill(0)
        .map(() => Math.random());
      f(...sample);
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
  return { evaluate };
};

const convertNode = (
  mjsNode: math.MathNode,
  options: ParseOptions = {}
): AnonMathNode => {
  const dependencies = getDependencies(mjsNode);
  const compile = () => compileNode(mjsNode, options);
  if (mjsNode.type === "FunctionAssignmentNode") {
    return {
      type: MathNodeType.FunctionAssignmentNode,
      name: mjsNode.name,
      params: mjsNode.params,
      compile,
      dependencies,
    };
  }
  if (mjsNode.type === "AssignmentNode") {
    return {
      type: MathNodeType.ValueAssignment,
      name: mjsNode.name,
      compile,
      dependencies,
    };
  }
  return {
    type: MathNodeType.Value,
    compile,
    dependencies,
  };
};

const anonParse: AnonParse = (expr) => convertNode(math.parse(expr));

const parse: Parse<ParseOptions> = (
  expr,
  id: string,
  options: ParseOptions = {}
) => {
  const node = convertNode(math.parse(expr), options) as MathNode;
  node.id = id;
  return node;
};

export type { ParseOptions };

export { anonParse, convertNode, parse };
