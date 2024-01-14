import classNames from "classnames";
import React, { useCallback } from "react";
import { OnMathFieldChange } from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";
import { ParseableObjs, DetailedAssignmentError } from "@math3d/parser";
import { round } from "lodash-es";

import ReadonlyMathField from "./ReadonlyMathField";
import type { IWidgetProps, WidgetChangeEvent } from "./types";
import ErrorTooltip from "./ErrorTooltip";
import style from "./widget.module.css";

type ExtraProps = {
  lhsClassName?: string;
  rhsClassName?: string;
  numDecimalDigits?: number;
};

const formatted = (x: string, numDecimalDigits?: number) => {
  if (numDecimalDigits === undefined) return x;
  const xNum = Number(x);
  const prefix = x.trim().startsWith("+") ? "+" : "";
  return prefix + round(xNum, numDecimalDigits).toString();
};

type MathAssignmentProps = IWidgetProps<ParseableObjs["assignment"]> &
  ExtraProps;

const extractErrors = (err: Error | undefined) => {
  if (!err) {
    return { lhs: undefined, rhs: undefined };
  }
  if (err instanceof DetailedAssignmentError) {
    return { lhs: err.lhs, rhs: err.rhs };
  }
  return { lhs: undefined, rhs: err };
};

const MathAssignment: React.FC<MathAssignmentProps> = (props) => {
  const {
    onChange,
    name,
    value,
    error,
    label,
    className,
    lhsClassName,
    rhsClassName,
    itemId,
    numDecimalDigits,
    ...others
  } = props;
  const onChangeLHS: OnMathFieldChange = useCallback(
    (e) => {
      const event: WidgetChangeEvent<ParseableObjs["assignment"]> = {
        name,
        value: { ...value, lhs: e.target.value },
        oldValue: value,
      };
      onChange(event);
    },
    [onChange, name, value],
  );
  const onChangeRHS: OnMathFieldChange = useCallback(
    (e) => {
      const event: WidgetChangeEvent<ParseableObjs["assignment"]> = {
        name,
        value: { ...value, rhs: e.target.value },
        oldValue: value,
      };
      onChange(event);
    },
    [value, onChange, name],
  );
  const errors = extractErrors(error);

  const lhsLabel = `${label} (left-hand side)`;
  const rhsLabel = `${label} (right-hand side)`;
  return (
    <div {...others} className={classNames(className, "d-flex")}>
      <ErrorTooltip error={errors.lhs}>
        <SmallMathField
          aria-label={lhsLabel}
          className={classNames(
            style["field-widget-input"],
            { [style["has-error"]]: !!errors.lhs },
            lhsClassName,
          )}
          onChange={onChangeLHS}
          value={value.lhs}
        />
      </ErrorTooltip>
      {/** Wrapper div similar to ErrorTooltips */}
      <div>
        <ReadonlyMathField value="=" />
      </div>
      <ErrorTooltip error={errors.rhs}>
        <SmallMathField
          aria-label={rhsLabel}
          className={classNames(
            style["field-widget-input"],
            { [style["has-error"]]: !!errors.rhs },
            rhsClassName,
          )}
          onChange={onChangeRHS}
          value={formatted(value.rhs, numDecimalDigits)}
        />
      </ErrorTooltip>
    </div>
  );
};

export default MathAssignment;
