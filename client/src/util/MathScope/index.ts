import MathScope, { OnChangeListener, IdentifiedExpression } from "./MathScope";
import {
  UnmetDependencyError,
  DuplicateAssignmentError,
  AssignmentError,
} from "./Evaluator";
import type { MathNode, Parse } from "./interfaces";
import * as adapter from "./adapter";

export type { OnChangeListener, IdentifiedExpression, MathNode, Parse };

export {
  AssignmentError,
  UnmetDependencyError,
  DuplicateAssignmentError,
  adapter,
};

export default MathScope;
