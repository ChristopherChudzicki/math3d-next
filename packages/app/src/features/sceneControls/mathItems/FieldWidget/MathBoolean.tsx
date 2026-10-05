import Tooltip from "@mui/material/Tooltip";
import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import Button from "@/ui/Button";
import Switch from "@/ui/Switch";
import type { OnMathFieldChange } from "@/ui/MathLive";
import SmallMathField from "@/ui/SmallMathField";
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

  const handleSwitchChange = useCallback(
    (checked: boolean) => triggerChange(checked ? "true" : "false"),
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
      role="group"
      {...others}
    >
      <Tooltip arrow title={tooltipTitle}>
        <Switch
          checked={result}
          disabled={shouldUseExpression}
          className={u.mr2}
          onCheckedChange={handleSwitchChange}
          aria-label={`Toggle property: ${label}`}
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className={styles["detail-text"]}
        >
          Reset
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={useExpression}
          className={styles["detail-text"]}
        >
          Use Expression
        </Button>
      )}
    </div>
  );
};

export default MathBoolean;
