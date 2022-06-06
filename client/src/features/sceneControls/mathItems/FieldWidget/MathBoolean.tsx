import React, { useCallback, useContext, useMemo, useState } from "react";
import classNames from "classnames";
import { OnMathFieldChange } from "util/components/MathLive";
import SmallMathField from "util/components/SmallMathField";
import { Switch, Tooltip } from "antd";
import { assertNotNil } from "util/predicates";
import { SubtleButton } from "util/components";
import { composeP } from "ramda";
import { MathContext, useMathResults } from "../mathScope";
import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const LITERAL_BOOLEAN_STRINGS = ["false", "true"];
const TOOLTIP_TRIGGERS = ["hover", "focus"];

const MathBoolean: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { name, title, value, onChange, error, style, className, itemId } =
    props;
  assertNotNil(itemId);
  const [shouldUseExpression, setShouldUseExpression] = useState(
    !LITERAL_BOOLEAN_STRINGS.includes(value)
  );

  const mathScope = useContext(MathContext);

  const triggerChange = useCallback(
    (newValue: string) => {
      const widgetChangeEvent = { name, value: newValue, mathScope };
      onChange(widgetChangeEvent);
    },
    [name, mathScope, onChange]
  );

  const handleChange: OnMathFieldChange = useCallback(
    (e) => {
      triggerChange(e.target.value);
    },
    [triggerChange]
  );

  const names = useMemo(() => [name], [name]);
  const result = !!useMathResults(itemId, names)[name];

  const handleSwitchChange = useCallback(
    (e: boolean) => triggerChange(e ? "true" : "false"),
    [triggerChange]
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
    <div className={classNames("d-flex", "align-items-center", className)}>
      <Tooltip trigger={TOOLTIP_TRIGGERS} title={tooltipTitle}>
        <Switch
          title={`Toggle property: ${title}`}
          checked={result}
          disabled={shouldUseExpression}
          size="small"
          className="me-2"
          onChange={handleSwitchChange}
        />
      </Tooltip>
      {shouldUseExpression && (
        <SmallMathField
          title={`Math Expression for: ${title}`}
          style={style}
          className={classNames(
            styles["math-widget"],
            { [styles["has-error"]]: error },
            "flex-1"
          )}
          onChange={handleChange}
        >
          {value}
        </SmallMathField>
      )}
      {shouldUseExpression ? (
        <SubtleButton
          title={`Reset: ${title}`}
          onClick={handleReset}
          className={styles["detail-text"]}
        >
          Reset
        </SubtleButton>
      ) : (
        <SubtleButton
          title={`Use Expression for: ${title}`}
          onClick={useExpression}
          className={styles["detail-text"]}
        >
          Use Expression
        </SubtleButton>
      )}
    </div>
  );
};

export default MathBoolean;
