import classNames from "classnames";
import React, { useCallback, useId, useMemo, useState } from "react";
import Button from "@/ui/Button";
import Switch from "@/ui/Switch";
import { Tooltip } from "@/ui/Tooltip";
import type { OnMathFieldChange } from "@/ui/MathLive";
import SmallMathField from "@/ui/SmallMathField";
import * as u from "@/util/styles/utils.module.css";
import invariant from "tiny-invariant";
import { mathItemConfigs } from "@math3d/mathitem-configs";
import type { MathItemType } from "@math3d/mathitem-configs";
import { useAppStore } from "@/store/hooks";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";

import { useMathResults } from "@/store/scene/evaluation/mathScope";
import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const LITERAL_BOOLEAN_STRINGS = ["false", "true"];
/** The property's value in a newly made item of this type. */
const defaultValue = (type: MathItemType, name: string): string => {
  const { properties } = mathItemConfigs[type].make("");
  return (properties as unknown as Record<string, string>)[name];
};

const COMPUTED_NOTE =
  "Value is computed by expression. Reset to re-enable toggle switch control.";

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
    "aria-describedby": describedBy,
    ...others
  } = props;
  invariant(!placeholder, "placeholder not supported by MathBoolean");
  invariant(itemId);
  const computedNoteId = useId();
  const [shouldUseExpression, setShouldUseExpression] = useState(
    !LITERAL_BOOLEAN_STRINGS.includes(value),
  );

  const mathScope = useMathScope();
  const store = useAppStore();
  // What Reset restores: the switch's value before "Use Expression" in this
  // mount, else the property's default.
  const [restoreValue, setRestoreValue] = useState<string | null>(null);

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

  const handleReset = useCallback(() => {
    const item = store.getState().scene.items[itemId];
    invariant(item);
    triggerChange(restoreValue ?? defaultValue(item.type, name));
    setRestoreValue(null);
    setShouldUseExpression(false);
  }, [store, itemId, name, restoreValue, triggerChange]);
  const useExpression = useCallback(() => {
    setRestoreValue(LITERAL_BOOLEAN_STRINGS.includes(value) ? value : null);
    setShouldUseExpression(true);
  }, [value]);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  // The open tooltip describes the switch itself; don't repeat its text.
  const switchDescribedBy = [
    describedBy,
    shouldUseExpression && !tooltipOpen && computedNoteId,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classNames(u.dFlex, u.alignItemsCenter, className)}
      ref={ref}
      role="group"
      {...others}
    >
      <Tooltip.Root
        disabled={!shouldUseExpression}
        onOpenChange={setTooltipOpen}
      >
        <Tooltip.Trigger
          aria-describedby={switchDescribedBy || undefined}
          render={
            <Switch
              checked={result}
              disabled={shouldUseExpression}
              className={u.mr2}
              onCheckedChange={handleSwitchChange}
              aria-label={`Toggle property: ${label}`}
            />
          }
        />
        <Tooltip.Popup>{COMPUTED_NOTE}</Tooltip.Popup>
      </Tooltip.Root>
      {shouldUseExpression && (
        <span id={computedNoteId} className={u.visuallyHidden}>
          {COMPUTED_NOTE}
        </span>
      )}
      {shouldUseExpression && (
        <SmallMathField
          aria-label={`Math Expression for: ${label}`}
          aria-describedby={describedBy}
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
