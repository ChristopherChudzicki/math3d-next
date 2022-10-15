import * as adapter from "./adapter";
import {
  AssignmentError,
  DuplicateAssignmentError,
  UnmetDependencyError,
} from "./Evaluator";
import type {
  MathNode,
  EvaluationScope,
  AnonMathNode,
  Parse,
} from "./interfaces";
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
  EvaluationError,
  AssignmentError,
  DuplicateAssignmentError,
  UnmetDependencyError,
};

export default MathScope;
