import * as adapter from "./adapter";
import { AssignmentError, DuplicateAssignmentError } from "./Evaluator";
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
  adapter,
  MathNodeType,
  EvaluationError,
  AssignmentError,
  DuplicateAssignmentError,
};

export default MathScope;
