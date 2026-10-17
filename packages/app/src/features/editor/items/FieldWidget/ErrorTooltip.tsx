import React, { useId, useState } from "react";
import { useToggle } from "@/util/hooks";
import { Tooltip } from "@/ui/Tooltip";

interface Props {
  error?: Error;
  /** The field; it must pass `aria-describedby` to its focusable element. */
  children: React.ReactElement<{ "aria-describedby"?: string }>;
}

/**
 * Shows `error` beside its field while the field has focus, and makes the
 * message the field's accessible description meanwhile.
 */
const ErrorTooltip: React.FC<Props> = ({ error, children }) => {
  const [isFocused, setIsFocused] = useToggle(false);
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const tooltipId = useId();
  const showTooltip = isFocused && !!error?.message;
  const describedBy = [
    children.props["aria-describedby"],
    showTooltip && tooltipId,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      <span ref={setAnchor} onBlur={setIsFocused.off} onFocus={setIsFocused.on}>
        {React.cloneElement(children, {
          "aria-describedby": describedBy || undefined,
        })}
      </span>
      <Tooltip.Root open={showTooltip}>
        <Tooltip.Popup id={tooltipId} anchor={anchor} side="bottom">
          {error?.message}
        </Tooltip.Popup>
      </Tooltip.Root>
    </>
  );
};

export default ErrorTooltip;
