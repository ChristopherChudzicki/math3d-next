import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import { SubtleButton } from "@/util/components";
import type { OnMathFieldChange } from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";
import { assertNotNil } from "@/util/predicates";
import { useMathScope } from "../mathItemsSlice";

import { useMathResults } from "../mathScope";
import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const LITERAL_BOOLEAN_STRINGS = ["false", "true"];

const MathBoolean = React.forwardRef<HTMLDivElement, IWidgetProps>(
  (props, ref) => {
    const {
      name,
      label,
      value,
      onChange,
      error,
      style,
      className,
      itemId,
      ...others
    } = props;
    assertNotNil(itemId);
    const [shouldUseExpression, setShouldUseExpression] = useState(
      !LITERAL_BOOLEAN_STRINGS.includes(value),
    );

    const mathScope = useMathScope();

    const triggerChange = useCallback(
      (newValue: string) => {
        const widgetChangeEvent = { name, value: newValue };
        onChange(widgetChangeEvent);
      },
      [name, onChange],
    );

    const handleChange: OnMathFieldChange = useCallback(
      (e) => {
        triggerChange(e.target.value);
      },
      [triggerChange],
    );

    const names = useMemo(() => [name], [name]);
    const result = !!useMathResults(mathScope, itemId, names)[name];

    const handleSwitchChange: React.ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (e) => triggerChange(e.target.checked ? "true" : "false"),
        [triggerChange],
      );

    const tooltipTitle = shouldUseExpression
      ? "Value is computed by expression. Reset to re-enable toggle switch control."
      : "";
    const handleReset = useCallback(() => {
      triggerChange("false");
      setShouldUseExpression(false);
    }, [triggerChange]);
    const useExpression = useCallback(() => setShouldUseExpression(true), []);

    return (
      <div
        className={classNames("d-flex", "align-items-center", className)}
        ref={ref}
        {...others}
      >
        <Tooltip arrow title={tooltipTitle}>
          <Switch
            aria-label={`Toggle property: ${label}`}
            checked={result}
            disabled={shouldUseExpression}
            size="small"
            className="me-2"
            onChange={handleSwitchChange}
          />
        </Tooltip>
        {shouldUseExpression && (
          <SmallMathField
            aria-label={`Math Expression for: ${label}`}
            style={style}
            className={classNames(
              { [styles["has-error"]]: error },
              "flex-1",
              styles["field-widget-input"],
            )}
            onChange={handleChange}
            value={value}
          />
        )}
        {shouldUseExpression ? (
          <SubtleButton onClick={handleReset} className={styles["detail-text"]}>
            Reset
          </SubtleButton>
        ) : (
          <SubtleButton
            onClick={useExpression}
            className={styles["detail-text"]}
          >
            Use Expression
          </SubtleButton>
        )}
      </div>
    );
  },
);
MathBoolean.displayName = "MathBoolean";

export default MathBoolean;
