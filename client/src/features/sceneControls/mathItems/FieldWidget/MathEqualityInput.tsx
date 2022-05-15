import React, { useCallback, useState, useEffect, useContext } from "react";
import mergeClassNames from "classnames";
import { AssignmentError } from "util/MathScope/Evaluator";
import type { IWidgetProps, WidgetChangeEvent } from "./types";
import { MathContext } from "../mathScope";
import style from "./widget.module.css";

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
  const { onChange, name, value, error, ...others } = props;
  const mathScope = useContext(MathContext);
  const [lhs, rhs] = splitAtFirstEquality(value);
  const onChangeLHS: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const newValue = [e.target.value, rhs].join("=");
      const event: WidgetChangeEvent = { name, value: newValue, mathScope };
      onChange(event);
    },
    [rhs, onChange, name, mathScope]
  );
  const onChangeRHS: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const newValue = [lhs, e.target.value].join("=");
      const event: WidgetChangeEvent = { name, value: newValue, mathScope };
      onChange(event);
    },
    [lhs, onChange, name, mathScope]
  );

  const lhsError = error instanceof AssignmentError;
  const rhsError = error && !lhsError;
  console.log(`rhs: ${rhs}`);
  return (
    <div {...others}>
      <input
        style={{ width: "25%" }}
        name={`${name}-lhs`}
        className={mergeClassNames({
          [style["has-error"]]: lhsError,
        })}
        type="text"
        value={lhs}
        onChange={onChangeLHS}
      />
      =
      <input
        name={`${name}-rhs`}
        type="text"
        className={mergeClassNames({
          [style["has-error"]]: rhsError,
        })}
        value={rhs}
        onChange={onChangeRHS}
      />
    </div>
  );
};

export default MathEqualityInput;
