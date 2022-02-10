import { MathNode, AssignmentNode, FunctionAssignmentNode } from "mathjs";

export type IParse = (parseable: string) => MathNode;

export type GeneralAssignmentNode = AssignmentNode | FunctionAssignmentNode;

export type EvaluationScope = Map<string, unknown>;

export type EvaluationResult = Map<string, unknown>;

export type EvaluationErrors = Map<string, Error>;
