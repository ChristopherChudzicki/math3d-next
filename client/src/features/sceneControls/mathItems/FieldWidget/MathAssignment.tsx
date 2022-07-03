import classNames from "classnames";
import React, { useCallback, useContext } from "react";
import { OnMathFieldChange } from "util/components/MathLive";
import SmallMathField from "util/components/SmallMathField";
import { AssignmentError } from "util/MathScope/Evaluator";
import { splitAtFirstEquality } from "util/parsing";
import { ParseAssignmentLHSError } from "util/parsing/rules";

import { MathContext } from "../mathScope";
import ReadonlyMathField from "./ReadonlyMathField";
import type { IWidgetProps, WidgetChangeEvent } from "./types";
import ErrorTooltip from "./ErrorTooltip";
import style from "./widget.module.css";

const MathAssignment: React.FC<IWidgetProps> = (props: IWidgetProps) => {
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
        {(handlers) => (
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
            {...handlers}
          />
        )}
      </ErrorTooltip>
      <ReadonlyMathField value="=" />
      <ErrorTooltip error={rhsError}>
        {(handlers) => (
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
            {...handlers}
          />
        )}
      </ErrorTooltip>
    </div>
  );
};

export default MathAssignment;
