import classNames from "classnames";
import React, { useCallback } from "react";
import { OnMathFieldChange } from "util/components/MathLive";
import SmallMathField from "util/components/SmallMathField";
import { AssignmentError } from "util/MathScope/Evaluator";
import { splitAtFirstEquality } from "util/parsing";
import { ParseAssignmentLHSError } from "util/parsing/rules";

import ReadonlyMathField from "./ReadonlyMathField";
import type { IWidgetProps, WidgetChangeEvent } from "./types";
import ErrorTooltip from "./ErrorTooltip";
import style from "./widget.module.css";

const MathAssignment: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { onChange, name, value, error, title, className, ...others } = props;
  const [lhs, rhs] = splitAtFirstEquality(value);
  const onChangeLHS: OnMathFieldChange = useCallback(
    (e) => {
      const newValue = [e.target.value, rhs].join("=");
      const event: WidgetChangeEvent = {
        name,
        value: newValue,
      };
      onChange(event);
    },
    [rhs, onChange, name]
  );
  const onChangeRHS: OnMathFieldChange = useCallback(
    (e) => {
      const newValue = [lhs, e.target.value].join("=");
      const event: WidgetChangeEvent = {
        name,
        value: newValue,
      };
      onChange(event);
    },
    [lhs, onChange, name]
  );

  const hasLhsError =
    error instanceof AssignmentError ||
    error instanceof ParseAssignmentLHSError;
  const hasRhsError = error && !hasLhsError;
  const lhsError = hasLhsError ? error : undefined;
  const rhsError = hasRhsError ? error : undefined;

  const lhsTitle = `${title} (left-hand side)`;
  const rhsTitle = `${title} (right-hand side)`;
  return (
    <div {...others} className={classNames(className, "d-flex")}>
      <ErrorTooltip error={lhsError}>
        <SmallMathField
          title={lhsTitle}
          className={classNames(
            style["field-widget"],
            style["adjust-margin-for-border"],
            { [style["has-error"]]: hasLhsError },
            className
          )}
          onChange={onChangeLHS}
          defaultValue={lhs}
        />
      </ErrorTooltip>
      <ReadonlyMathField value="=" />
      <ErrorTooltip error={rhsError}>
        <SmallMathField
          title={rhsTitle}
          className={classNames(
            style["field-widget"],
            style["adjust-margin-for-border"],
            { [style["has-error"]]: hasRhsError },
            className,
            "flex-1"
          )}
          onChange={onChangeRHS}
          defaultValue={rhs}
        />
      </ErrorTooltip>
    </div>
  );
};

export default MathAssignment;
