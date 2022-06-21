import * as adapter from "./adapter";
import {
  AssignmentError,
  DuplicateAssignmentError,
  UnmetDependencyError,
} from "./Evaluator";
import type { MathNode, Parse } from "./interfaces";
import MathScope, { IdentifiedExpression, OnChangeListener } from "./MathScope";

export type { IdentifiedExpression, MathNode, OnChangeListener, Parse };

export {
  adapter,
  AssignmentError,
  DuplicateAssignmentError,
  UnmetDependencyError,
};

export default MathScope;
