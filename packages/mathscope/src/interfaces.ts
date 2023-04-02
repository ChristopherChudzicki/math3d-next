enum MathNodeType {
  FunctionAssignmentNode = "FunctionAssignmentNode",
  ValueAssignment = "ValueAssignment",
  Value = "Value",
}

const assignmentTypes = [
  MathNodeType.FunctionAssignmentNode,
  MathNodeType.ValueAssignment,
] as const;
const ASSIGNMENT_TYPES: readonly MathNodeType[] = assignmentTypes;

type AssignmentType = typeof assignmentTypes[number];

type Evaluate = (scope?: Map<string, unknown>) => unknown;
interface MathNodeBase<T extends MathNodeType = MathNodeType> {
  id: string;
  type: T;
  evaluate: Evaluate;
  dependencies: Set<string>;
  toString: () => string;
}

interface AssignmentNode<T extends AssignmentType = AssignmentType>
  extends MathNodeBase<T> {
  name: string;
}

interface FunctionAssignmentNode
  extends AssignmentNode<MathNodeType.FunctionAssignmentNode> {
  type: MathNodeType.FunctionAssignmentNode;
  params: string[];
}

type MathNodes = {
  [MathNodeType.FunctionAssignmentNode]: FunctionAssignmentNode;
  [MathNodeType.ValueAssignment]: AssignmentNode<MathNodeType.ValueAssignment>;
  [MathNodeType.Value]: MathNodeBase<MathNodeType.Value>;
};

type MathNode = MathNodes[keyof MathNodes];

type AnonMathNodes = {
  [K in keyof MathNodes]: Omit<MathNodes[K], "id">;
};
type AnonMathNode = AnonMathNodes[keyof AnonMathNodes];

export type AnonAssignmentNode = Omit<AssignmentNode, "id">;

type Parse<P> = (parseable: P) => AnonMathNode;

type EvaluationScope = Map<string, unknown>;

type EvaluationResult = Map<string, unknown>;

interface Diff<T> {
  added: Set<T>;
  updated: Set<T>;
  deleted: Set<T>;
  touched: Set<T>;
}

export interface FullDiff<T> extends Diff<T> {
  unchanged: Set<T>;
}

export interface EvaluationChange {
  results: Diff<string>;
  errors: Diff<string>;
}

export { ASSIGNMENT_TYPES, MathNodeType };
export type {
  AnonMathNode,
  AssignmentNode,
  AssignmentType,
  Diff,
  Evaluate,
  EvaluationResult,
  EvaluationScope,
  MathNode,
  Parse,
};
