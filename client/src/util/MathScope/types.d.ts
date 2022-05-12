import { MathNode, AssignmentNode, FunctionAssignmentNode } from "mathjs";

export type IParse = (parseable: string) => MathNode;

export type GeneralAssignmentNode = AssignmentNode | FunctionAssignmentNode;

export type EvaluationScope = Map<string, unknown>;

export type EvaluationResult = Map<string, unknown>;

export type EvaluationErrors = Map<string, Error>;

export type ParseErrors = Map<string, Error>;

export interface EvaluationChange {
  results: Diff<string>;
  errors: Diff<string>;
}

export interface EvaluatorAction {
  type: "delete" | "add";
  nodes: MathNode[];
}

export interface Diff<T> {
  added: Set<T>;
  updated: Set<T>;
  deleted: Set<T>;
  touched: Set<T>;
}

export interface FullDiff<T> extends Diff<T> {
  added: Set<T>;
  updated: Set<T>;
  deleted: Set<T>;
  unchanged: Set<T>;
}

type Comparer<T> = (t1: T, t2: T) => boolean;
