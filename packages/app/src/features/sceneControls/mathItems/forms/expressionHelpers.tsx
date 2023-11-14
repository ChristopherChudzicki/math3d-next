import { MathItem, WidgetType } from "@math3d/mathitem-configs";
import React, { useCallback, useMemo } from "react";
import {
  ParseableObjs,
  ParseableArray,
  ParameterErrors,
  DetailedAssignmentError,
} from "@math3d/parser";

import invariant from "tiny-invariant";
import ordinal from "ordinal";
import ReadonlyMathField from "../FieldWidget/ReadonlyMathField";
import { OnWidgetChange, WidgetChangeEvent } from "../FieldWidget/types";
import styles from "./ItemForms.module.css";
import FieldWidget, {
  useOnWidgetChange,
  usePatchPropertyOnChange,
} from "../FieldWidget";

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

type HasDomain = {
  properties: {
    domain: ParseableArray<
      ParseableObjs["function-assignment"] | ParseableObjs["expr"]
    >;
  };
};

interface DomainFormProps {
  item: MathItem & HasDomain;
  domainError?: Error;
  exprProps: ExpressionProps;
}
const DomainForm: React.FC<DomainFormProps> = ({
  item,
  exprProps,
  domainError,
}) => {
  const { domain } = item.properties;

  invariant(
    domain.items.every(
      (x) => x.type === "expr" || x.type === "function-assignment",
    ),
    "Domain must be a list of expressions or function assignments",
  );

  const patchProperty = usePatchPropertyOnChange(item);
  const { assignments, errors: assignmentErrors, handlers } = exprProps;
  const domainValueHandlers: OnWidgetChange<string>[] = useMemo(() => {
    return domain.items.map((paramDomain, i) => {
      const f: OnWidgetChange<string> = (e) => {
        const event = { ...e, name: "domain" };
        const subpath =
          paramDomain.type === "function-assignment"
            ? `items/${i}/rhs`
            : `items/${i}/expr`;
        patchProperty(event, subpath);
      };
      return f;
    });
  }, [domain, patchProperty]);
  return (
    <ParameterContainer>
      {domain.items.map((paramDomain, i) => {
        /**
         * The domain property is an array for functions.
         * The UI displays each item in the array with separate LHS and RHS fields.
         * If the domain property has error, extract the relevant error (if there is one)
         * for the RHS of each domain dimension.
         */
        const getDomainIndexRhsError = (
          err: Error | undefined,
          domainIndex: number,
        ) => {
          if (!err) return undefined;
          if (!(err instanceof AggregateError)) return err;
          const indexError = err.errors[domainIndex];
          if (indexError instanceof DetailedAssignmentError)
            return indexError.rhs;
          return indexError;
        };

        return (
          <ParameterForm
            // it's fine, these are not re-orderable
            // eslint-disable-next-line react/no-array-index-key
            key={`param-${i}`}
            nameInput={
              <FieldWidget
                className={styles["param-input"]}
                widget={WidgetType.MathValue}
                error={assignmentErrors[0].paramErrors?.[i]}
                label={`Name for ${ordinal(i + 1)} parameter`}
                name={`${ordinal(i + 1)}-parameter-name`}
                value={assignments[0].params[i]}
                onChange={handlers.param[i]}
              />
            }
            rangeInput={
              <FieldWidget
                className={styles["param-input"]}
                widget={WidgetType.MathValue}
                label={`Domain for ${ordinal(i + 1)} parameter`}
                name={`${ordinal(i + 1)}-parameter-value`}
                error={getDomainIndexRhsError(domainError, i)}
                value={
                  paramDomain.type === "function-assignment"
                    ? paramDomain.rhs
                    : paramDomain.expr
                }
                onChange={domainValueHandlers[i]}
              />
            }
          />
        );
      })}
    </ParameterContainer>
  );
};

type ExpressionProps = {
  /**
   * An array of assignments.
   */
  assignments: ParseableObjs["function-assignment"][];
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
    paramErrors?: Record<number, Error>;
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
  item: MathItem & HasDomain,
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
  errors: Partial<Record<string, Error>>,
): ExpressionProps => {
  const onWidgetChange = useOnWidgetChange(item);

  const assignments: ParseableObjs["function-assignment"][] = useMemo(
    () =>
      exprNames.map((name) => {
        // @ts-expect-error TODO: Resolve this.
        const expr = item.properties[name];
        invariant(
          expr.type === "function-assignment",
          "Expected type: function-assignment",
        );
        return expr;
      }),
    [exprNames, item.properties],
  );
  const { domain } = item.properties;

  const updateExpr = useCallback(
    (newAssignment: ParseableObjs["function-assignment"], propName: string) => {
      const event: WidgetChangeEvent<ParseableObjs["function-assignment"]> = {
        name: propName,
        value: newAssignment,
      };
      onWidgetChange(event);
    },
    [onWidgetChange],
  );

  const updateDomains = useCallback(
    (newParameters: string[]) => {
      const event: WidgetChangeEvent<ParseableObjs["array"]> = {
        name: "domain",
        value: {
          items: domain.items.map((pd, i) => {
            return pd.type === "expr"
              ? pd
              : {
                  type: "function-assignment",
                  name: "_f",
                  params: newParameters
                    .filter((p, k) => k !== i)
                    // if a param is missing, we still want the function to have
                    // correct number of mathjs-recognized symbol arguments
                    .map((p) => (p.trim() === "" ? "_" : p)),
                  rhs: pd.rhs,
                };
          }),
          type: "array",
        },
      };
      onWidgetChange(event);
    },
    [domain.items, onWidgetChange],
  );

  const handlers = useMemo(() => {
    const rhs: OnWidgetChange[] = exprNames.map((name, i) => {
      const handler: OnWidgetChange = (e) => {
        const newAssignment = { ...assignments[i], rhs: e.value };
        updateExpr(newAssignment, name);
      };
      return handler;
    });
    const param: OnWidgetChange[] = Array(numParams)
      .fill(null)
      .map((_null, handlerIndex) => {
        const handler: OnWidgetChange = (e) => {
          assignments.forEach((expr, i) => {
            const newParams = [...expr.params];
            newParams[handlerIndex] = e.value.replaceAll(/[,=]/g, "");
            const newAssignment = { ...expr, params: newParams };
            updateExpr(newAssignment, exprNames[i]);
            updateDomains(newParams);
          });
        };
        return handler;
      });
    return { rhs, param };
  }, [assignments, exprNames, numParams, updateExpr, updateDomains]);

  const errs = useMemo(
    () =>
      exprNames.map((exprName) => {
        const err = errors[exprName];
        if (!err) return {};
        if (err instanceof DetailedAssignmentError) {
          const { lhs, rhs } = err;
          const paramErrors =
            lhs instanceof ParameterErrors ? lhs.paramErrors : {};
          return { lhs, rhs, paramErrors };
        }
        if (err instanceof DetailedAssignmentError) return err;
        return { rhs: err };
      }),
    [exprNames, errors],
  );

  return { handlers, errors: errs, assignments };
};

export {
  DomainForm,
  ParameterContainer,
  ParameterForm,
  useExpressionsAndParameters,
};
export type { ExpressionProps };
