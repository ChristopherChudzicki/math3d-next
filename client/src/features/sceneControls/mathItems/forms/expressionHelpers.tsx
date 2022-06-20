import React, {
  MutableRefObject,
  useRef,
  useCallback,
  useContext,
  useState,
} from "react";
import { assertInstanceOf } from "util/predicates";
import { getParameters, latexParser, splitAtFirstEquality } from "util/parsing";
import ReadonlyMathField from "../FieldWidget/ReadonlyMathField";
import { OnWidgetChange } from "../FieldWidget/types";
import { MathContext } from "../mathScope";
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

interface ExprData {
  params: string[];
  rhs: string;
}

type OnParamNameChange = (value: string, index: number) => void;

const validateSymbolName = (value: string): void => {
  if (value.startsWith("_")) {
    throw new Error("Parameter names should not begin with underscores.");
  }
  const mjsNode = latexParser.mjsParse(value);
  if (mjsNode.type === "SymbolNode") return;
  throw new Error(`String "${value}" is not a valid parameter name`);
};

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
  initialExpr: string,
  onWidgetChange: OnWidgetChange
): {
  /**
   * A ref which holds the RHS and parameters separately.
   */
  exprRef: MutableRefObject<ExprData>;
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
  /**
   * Stores errors related to parameter names. E.g., `"a + b"` is not a valid
   * parameter name, and attempting to provide it to `onParamNameChange` will
   * result an an error stored in this object. Errors are indexed by parameter
   * numbers.
   */
  paramNameErrors: Record<number, Error>;
} => {
  const mathScope = useContext(MathContext);
  const [paramErrors, setParamErrors] = useState<Record<number, Error>>({});
  const exprRef: MutableRefObject<ExprData> = useRef({
    rhs: splitAtFirstEquality(initialExpr)[1],
    params: getParameters(initialExpr),
  });

  const onExprChange = useCallback(() => {
    const { current } = exprRef;
    const value = `_f(${current.params.join(",")})=${current.rhs}`;
    const event = {
      name: "expr",
      value,
      mathScope,
    };
    onWidgetChange(event);
  }, [onWidgetChange, mathScope]);

  const onParamNameChange: OnParamNameChange = useCallback(
    (value, index) => {
      try {
        validateSymbolName(value);
        exprRef.current.params[index] = value;
        onExprChange();
        setParamErrors((state) => {
          const { [index]: _thisError, ...others } = state;
          return others;
        });
      } catch (err) {
        setParamErrors((state) => {
          assertInstanceOf(err, Error);
          return { ...state, [index]: err };
        });
      }
    },
    [onExprChange]
  );
  const onRhsChange: OnWidgetChange = useCallback(
    (e) => {
      exprRef.current.rhs = e.value;
      onExprChange();
    },
    [onExprChange]
  );
  return {
    onRhsChange,
    onParamNameChange,
    exprRef,
    paramNameErrors: paramErrors,
  };
};

export { ParameterContainer, ParameterForm, useExpressionAndParameters };
