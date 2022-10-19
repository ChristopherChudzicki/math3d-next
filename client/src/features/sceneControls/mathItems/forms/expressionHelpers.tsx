import { MathItem } from "@/configs";
import React, { useCallback, useMemo } from "react";
import { FunctionAssignment, ParseableObjs } from "@/util/parsing";

import { DetailedAssignmentError } from "@/util/parsing/MathJsParser";
import ReadonlyMathField from "../FieldWidget/ReadonlyMathField";
import { OnWidgetChange, WidgetChangeEvent } from "../FieldWidget/types";
import styles from "./ItemForms.module.css";
import { useOnWidgetChange } from "../FieldWidget";

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

type ExpressionProps = {
  /**
   * An array of assignments.
   */
  assignments: FunctionAssignment[];
  /**
   * Arrays of widget change handlers.
   *  - One `rhs` handler for each expression name
   *  - One `param` handler for each parameter name in the expression LHS
   */
  handlers: {
    rhs: OnWidgetChange[];
    param: OnWidgetChange[];
  };
  /**
   * One error object for each exprName
   */
  errors: {
    rhs?: Error;
    lhs?: Error;
  }[];
};

/**
 * Several math items include properties whose values should be
 * parseable as functions, e.g., an "expr" property with value
 * `"f(x, y) = x^2 + y^2"`.
 *
 * We'd like a UI that:
 *  - displays only the right-hand-side
 *  - allows editing the parameter names (e.g., change x, y to x1, x2)
 *  - shows "expr" errors at the appropriate input (parameter name or RHS value)
 *
 * This hook provides callbacks and data to assist with this.
 */
const useExpressionsAndParameters = (
  item: MathItem,
  /**
   * The names of the function-parseable math properties. If multiple are
   * provided, they should have the same LHS.
   *
   * @examples
   *  - ["expr"] for ParametricCurve, etc
   *  - ["lhs", "rhs"] for implicit surfaces
   */
  exprNames: readonly string[],
  numParams: number,
  errors: Partial<Record<string, Error>>
): ExpressionProps => {
  const onWidgetChange = useOnWidgetChange(item);

  const exprs: ParseableObjs["assignment"][] = useMemo(
    // @ts-expect-error need to resolve this
    () => exprNames.map((name) => item.properties[name]),
    [exprNames, item.properties]
  );

  const assignments = useMemo(
    () =>
      exprs.map((expr) =>
        FunctionAssignment.fromExpr(`${expr.lhs}=${expr.rhs}`)
      ),
    [exprs]
  );

  const updateExpr = useCallback(
    (newAssignment: FunctionAssignment, propName: string) => {
      const event: WidgetChangeEvent<ParseableObjs["assignment"]> = {
        name: propName,
        value: {
          lhs: newAssignment.getLhs(),
          rhs: newAssignment.rhs,
          type: "assignment",
        },
      };
      onWidgetChange(event);
    },
    [onWidgetChange]
  );

  const handlers = useMemo(() => {
    const rhs: OnWidgetChange[] = exprNames.map((name, i) => {
      const handler: OnWidgetChange = (e) => {
        const assignment = assignments[i];
        const newAssignment = assignment.clone({ rhs: e.value });
        updateExpr(newAssignment, name);
      };
      return handler;
    });
    const param: OnWidgetChange[] = Array(numParams)
      .fill(null)
      .map((_null, handlerIndex) => {
        const handler: OnWidgetChange = (e) => {
          assignments.forEach((assignment, i) => {
            const newParams = [...assignment.params];
            newParams[handlerIndex] = e.value.replaceAll(/[,=]/g, "");
            const newAssignment = assignment.clone({ params: newParams });
            updateExpr(newAssignment, exprNames[i]);
          });
        };
        return handler;
      });
    return { rhs, param };
  }, [assignments, updateExpr, exprNames, numParams]);

  const errs = useMemo(
    () =>
      exprNames.map((exprName) => {
        const err = errors[exprName];
        if (!err) return {};
        if (err instanceof DetailedAssignmentError) return err;
        return { rhs: err };
      }),
    [exprNames, errors]
  );

  return { assignments, handlers, errors: errs };
};

export { ParameterContainer, ParameterForm, useExpressionsAndParameters };
export type { ExpressionProps };
