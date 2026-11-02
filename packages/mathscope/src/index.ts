import { SimplerMathJsParser } from "./adapter";
import {
  AssignmentError,
  DuplicateAssignmentError,
  CyclicAssignmentError,
} from "./Evaluator";
import type {
  MathNode,
  EvaluationScope,
  AnonMathNode,
  Parse,
} from "./interfaces";
import { MathNodeType } from "./interfaces";
import MathScope, { IdentifiedParseable, OnChangeListener } from "./MathScope";
import { EvaluationError } from "./errors";

export type {
  IdentifiedParseable,
  MathNode,
  OnChangeListener,
  Parse,
  EvaluationScope,
  AnonMathNode,
};

export {
  SimplerMathJsParser,
  MathNodeType,
  EvaluationError,
  AssignmentError,
  DuplicateAssignmentError,
  CyclicAssignmentError,
};

export default MathScope;
