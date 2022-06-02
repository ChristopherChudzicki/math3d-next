import * as math from "mathjs";
import { MathNodeType } from "./interfaces";
import type {
  AnonParse,
  Parse,
  AnonMathNode,
  Evaluatable,
  EvaluationScope,
  MathNode,
} from "./interfaces";

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

const compileNode = (
  mjsNode: math.MathNode,
  options: ParseOptions
): Evaluatable => {
  const { evaluate: rawEvaluate } = mjsNode.compile();
  const { validate = defaultParseOptions.validate } = {
    ...options,
  };
  const unvalidatedEvaluate = (scope?: EvaluationScope) => {
    const rawResult = rawEvaluate(scope);
    if (math.isMatrix(rawResult)) {
      return rawResult.toArray();
    }
    if (typeof rawResult === "function") {
      const f = (...args: unknown[]) => {
        const evaluated = rawResult(...args);
        return math.isMatrix(evaluated) ? evaluated.toArray() : evaluated;
      };
      if (mjsNode.type === "FunctionAssignmentNode") {
        Object.defineProperty(f, "length", { value: mjsNode.params.length });
      }

      return f;
    }
    return rawResult;
  };
  const evaluate = (scope?: EvaluationScope) => {
    const result = unvalidatedEvaluate(scope);
    validate(result, mjsNode);
    return result;
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

export { anonParse, parse, convertNode };
