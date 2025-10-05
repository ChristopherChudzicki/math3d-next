import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import { SubtleButton } from "@/util/components";
import type { OnMathFieldChange } from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";
import * as u from "@/util/styles/utils.module.css";
import invariant from "tiny-invariant";
import { useMathScope } from "../sceneSlice";

import { useMathResults } from "../mathScope";
import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const LITERAL_BOOLEAN_STRINGS = ["false", "true"];

const MathBoolean: React.FC<
  IWidgetProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
> = (props) => {
  const {
    name,
    label,
    value,
    onChange,
    error,
    style,
    className,
    itemId,
    ref,
    placeholder,
    ...others
  } = props;
  invariant(!placeholder, "placeholder not supported by MathBoolean");
  invariant(itemId);
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
      className={classNames(u.dFlex, u.alignItemsCenter, className)}
      ref={ref}
      {...others}
    >
      <Tooltip arrow title={tooltipTitle}>
        <Switch
          checked={result}
          disabled={shouldUseExpression}
          size="small"
          className={u.mr2}
          onChange={handleSwitchChange}
          slotProps={{
            input: {
              "aria-label": `Toggle property: ${label}`,
            },
          }}
        />
      </Tooltip>
      {shouldUseExpression && (
        <SmallMathField
          aria-label={`Math Expression for: ${label}`}
          style={style}
          className={classNames(
            { [styles["has-error"]]: error },
            u.flex1,
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
        <SubtleButton onClick={useExpression} className={styles["detail-text"]}>
          Use Expression
        </SubtleButton>
      )}
    </div>
  );
};

export default MathBoolean;
