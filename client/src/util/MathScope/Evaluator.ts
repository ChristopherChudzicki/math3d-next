import { MathNode, EvalFunction } from "mathjs";
import type ExpressionGraphManager from "./ExpressionGraphManager";
import type {
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  GeneralAssignmentNode,
} from "./types";
import DiffingMap, { Diff } from "./DiffingMap";
import { assertIsError } from "./util";

const getId = (node: MathNode) => node.comment;

export default class Evaluator {
  expressionGraphManager: ExpressionGraphManager;

  compiled = new WeakMap<MathNode, EvalFunction>();

  result: EvaluationResult = new Map();

  scope: EvaluationScope = new Map();

  errors: EvaluationErrors = new Map();

  constructor(expressionGraphManager: ExpressionGraphManager) {
    this.expressionGraphManager = expressionGraphManager;
  }

  private compile(node: MathNode) {
    const cachedValue = this.compiled.get(node);
    if (cachedValue) return cachedValue;
    const compiled = node.compile();
    this.compiled.set(node, compiled);
    return compiled;
  }

  private evaluateNodes(nodes: MathNode[]): {
    resultUpdates: Diff<string>;
    errorUpdates: Diff<string>;
  } {
    const result = new DiffingMap(this.result);
    const errors = new DiffingMap(this.errors);

    nodes.forEach((node) => {
      const { evaluate } = this.compile(node);
      const exprId = getId(node);
      try {
        const evaluated = evaluate(this.scope);
        result.set(exprId, evaluated);
        errors.delete(exprId);
      } catch (err) {
        assertIsError(err);
        result.delete(exprId);
        errors.set(exprId, err);
      }
    });

    const resultUpdates = result.getDiff();
    const errorUpdates = errors.getDiff();
    return { resultUpdates, errorUpdates };
  }
}
