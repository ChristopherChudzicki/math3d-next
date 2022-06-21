interface Evaluatable {
  evaluate: (scope?: Map<string, unknown>) => unknown;
}

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

interface MathNodeBase<T extends MathNodeType = MathNodeType> {
  id: string;
  type: T;
  compile: () => Evaluatable;
  dependencies: Set<string>;
}

interface AssignmentNode<T extends AssignmentType = AssignmentType>
  extends MathNodeBase<T> {
  name: string;
}

interface FunctionAssignmentNode
  extends MathNodeBase<MathNodeType.FunctionAssignmentNode> {
  type: MathNodeType.FunctionAssignmentNode;
  params: string[];
}

type MathNode =
  | MathNodeBase<MathNodeType.Value>
  | AssignmentNode
  | FunctionAssignmentNode;

export type AnonAssignmentNode = Omit<AssignmentNode, "id">;
export type AnonValueNode = Omit<MathNodeBase<MathNodeType.Value>, "id">;
export type AnonFunctionAssignmentNode = Omit<FunctionAssignmentNode, "id">;

type AnonMathNode =
  | AnonAssignmentNode
  | AnonValueNode
  | AnonFunctionAssignmentNode;

type AnonParse = (expr: string) => AnonMathNode;

type Parse<PO> = (expr: string, id: string, options?: PO) => MathNode;

type EvaluationScope = Map<string, unknown>;

type EvaluationResult = Map<string, unknown>;

type EvaluationErrors = Map<string, Error>;

type ParseErrors = Map<string, Error>;

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
  AnonParse,
  AssignmentNode,
  AssignmentType,
  Diff,
  Evaluatable,
  EvaluationErrors,
  EvaluationResult,
  EvaluationScope,
  MathNode,
  Parse,
  ParseErrors,
};
