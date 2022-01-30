import { MathNode, AssignmentNode, FunctionAssignmentNode } from "mathjs";

export type IParse = (parseable: string) => MathNode;

export type GeneralAssignmentNode = AssignmentNode | FunctionAssignmentNode;

export type EvaluationScope = Record<string, unknown>;
