import React, { useCallback, useMemo } from "react";
import { FunctionAssignment } from "util/parsing";

import ReadonlyMathField from "../FieldWidget/ReadonlyMathField";
import { OnWidgetChange } from "../FieldWidget/types";
import { useMathScope } from "../mathItemsSlice";
import styles from "./ItemForms.module.css";

interface ParameterContainerProps {
  children: React.ReactNode;
}
const ParameterContainer: React.FC<ParameterContainerProps> = ({
  children,
}) => {
  return <div className={styles.parameters}>{children}</div>;
};

interface ParameterFormProps {
  nameInput: React.ReactNode;
  rangeInput: React.ReactNode;
}

const ParameterForm: React.FC<ParameterFormProps> = (props) => {
  return (
    <>
      <div className="d-flex justify-content-end">
        {props.nameInput}
        <ReadonlyMathField value="\in" />
      </div>
      <div className="d-flex">{props.rangeInput}</div>
    </>
  );
};

type OnParamNameChange = (value: string, index: number) => void;

/**
 * Several math items include an "expr" property whose values should be
 * parseable as functions, e.g., `"f(x, y) = x^2 + y^2"`.
 *
 * We'd like a UI that:
 *  - displays only the right-hand-side
 *  - allows editing the parameter names (e.g., change x, y to x1, x2).
 *
 * This hook provides callbacks and data to assist with this.
 *
 */
const useExpressionAndParameters = (
  expr: string,
  onWidgetChange: OnWidgetChange
): {
  /**
   * A ref which holds the RHS and parameters separately.
   */
  assignment: FunctionAssignment;
  /**
   * An OnWidgetChange handler that updates `exprRef` and re-combines the params
   * and RHS to a function-like expression, updating the store and MathScope
   * with the function-like expression value.
   */
  onRhsChange: OnWidgetChange;
  /**
   * An event handler (value, i) => void that updates the i'th parameter name
   * to the provided value. Updates `exprRef`, `paramNameErrors`, the store, and MathScope.
   */
  onParamNameChange: OnParamNameChange;
} => {
  const mathScope = useMathScope();
  const assignment = useMemo(() => FunctionAssignment.fromExpr(expr), [expr]);

  const updateExpr = useCallback(
    (newAssignment: FunctionAssignment) => {
      const event = { name: "expr", value: newAssignment.toExpr(), mathScope };
      onWidgetChange(event);
    },
    [onWidgetChange, mathScope]
  );

  const onParamNameChange: OnParamNameChange = useCallback(
    (value, index) => {
      const newParams = [...assignment.params];
      newParams[index] = value.replaceAll(",", "");
      const newAssignment = assignment.clone({ params: newParams });
      updateExpr(newAssignment);
    },
    [updateExpr, assignment]
  );
  const onRhsChange: OnWidgetChange = useCallback(
    (e) => {
      const newAssignment = assignment.clone({ rhs: e.value });
      updateExpr(newAssignment);
    },
    [updateExpr, assignment]
  );
  return {
    assignment,
    onRhsChange,
    onParamNameChange,
  };
};

export { ParameterContainer, ParameterForm, useExpressionAndParameters };
