import React, { useCallback, useContext } from "react";
import { AssignmentError } from "util/MathScope/Evaluator";
import classNames from "classnames";
import SmallMathField, { makeReadOnly } from "util/components/SmallMathField";
import { OnMathFieldChange } from "util/components/MathLive";
import { ParseAssignmentLHSError } from "util/parsing/rules";
import type { IWidgetProps, WidgetChangeEvent } from "./types";
import style from "./widget.module.css";
import { MathContext } from "../mathScope";

const splitAtFirstEquality = (text: string) => {
  const pieces = text.split("=");
  if (pieces.length < 2) {
    // They should have eactly one, but if they have more, that's an issue for the parser
    throw new Error(`Fatal error: Assignments should have an equality sign.`);
  }
  const [lhs, ...others] = pieces;
  const rhs = others.join("=");
  return [lhs, rhs];
};

const MathEqualityInput: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { onChange, name, value, error, title, className, ...others } = props;
  const [lhs, rhs] = splitAtFirstEquality(value);
  const mathScope = useContext(MathContext);
  const onChangeLHS: OnMathFieldChange = useCallback(
    (e) => {
      const newValue = [e.target.value, rhs].join("=");
      const event: WidgetChangeEvent = {
        name,
        value: newValue,
        mathScope,
      };
      onChange(event);
    },
    [rhs, onChange, name, mathScope]
  );
  const onChangeRHS: OnMathFieldChange = useCallback(
    (e) => {
      const newValue = [lhs, e.target.value].join("=");
      const event: WidgetChangeEvent = {
        name,
        value: newValue,
        mathScope,
      };
      onChange(event);
    },
    [lhs, onChange, name, mathScope]
  );

  const lhsError =
    error instanceof AssignmentError ||
    error instanceof ParseAssignmentLHSError;
  const rhsError = error && !lhsError;

  const lhsTitle = `${title} (left-hand side)`;
  const rhsTitle = `${title} (right-hand side)`;
  return (
    <div {...others} className={classNames(className, "d-flex")}>
      <SmallMathField
        title={lhsTitle}
        className={classNames(
          style["math-input"],
          { [style["has-error"]]: lhsError },
          className
        )}
        onChange={onChangeLHS}
        defaultValue={lhs}
      />
      <SmallMathField
        className={classNames("static-math", "align-self-center", "px-1")}
        makeOptions={makeReadOnly}
        defaultValue="="
      />
      <SmallMathField
        title={rhsTitle}
        className={classNames(
          style["math-input"],
          { [style["has-error"]]: rhsError },
          className,
          "flex-1"
        )}
        onChange={onChangeRHS}
        defaultValue={rhs}
      />
    </div>
  );
};

export default MathEqualityInput;
