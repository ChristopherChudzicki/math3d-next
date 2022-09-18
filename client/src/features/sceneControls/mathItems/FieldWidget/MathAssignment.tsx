import classNames from "classnames";
import React, { useCallback } from "react";
import { OnMathFieldChange } from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";
import { AssignmentError } from "@/util/MathScope/Evaluator";
import { splitAtFirstEquality } from "@/util/parsing";
import { ParseAssignmentLHSError } from "@/util/parsing/rules";

import ReadonlyMathField from "./ReadonlyMathField";
import type { IWidgetProps, WidgetChangeEvent } from "./types";
import ErrorTooltip from "./ErrorTooltip";
import style from "./widget.module.css";

const MathAssignment: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { onChange, name, value, error, label, className, itemId, ...others } =
    props;
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

  const lhsLabel = `${label} (left-hand side)`;
  const rhsLabel = `${label} (right-hand side)`;
  return (
    <div {...others} className={classNames(className, "d-flex")}>
      <ErrorTooltip error={lhsError}>
        <SmallMathField
          aria-label={lhsLabel}
          className={classNames(
            style["field-widget-input"],
            { [style["has-error"]]: hasLhsError },
            className
          )}
          onChange={onChangeLHS}
        >
          {lhs}
        </SmallMathField>
      </ErrorTooltip>
      <div>
        {" "}
        {/** Wrapper div similar to ErrorTooltips */}
        <ReadonlyMathField value="=" />
      </div>
      <ErrorTooltip error={rhsError}>
        <SmallMathField
          aria-label={rhsLabel}
          className={classNames(
            style["field-widget-input"],
            { [style["has-error"]]: hasRhsError },
            className,
            "flex-1"
          )}
          onChange={onChangeRHS}
        >
          {rhs}
        </SmallMathField>
      </ErrorTooltip>
    </div>
  );
};

export default MathAssignment;
