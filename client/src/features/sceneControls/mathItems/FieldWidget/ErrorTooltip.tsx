import React, { useMemo } from "react";
import { Tooltip } from "antd";
import { useToggle } from "util/hooks";
import styles from "./ErrorTooltip.module.css";

interface FocusHandlers {
  onFocus: React.FocusEventHandler;
  onBlur: React.FocusEventHandler;
}

interface Props {
  error?: Error;
  children?: (handlers: FocusHandlers) => React.ReactNode;
}

const ErrorTooltip: React.FC<Props> = ({ error, children }) => {
  const [isFocused, setIsFocused] = useToggle(false);
  const showTooltip = isFocused && !!error?.message;
  const handlers = useMemo(
    () => ({
      onBlur: setIsFocused.off,
      onFocus: setIsFocused.on,
    }),
    [setIsFocused.off, setIsFocused.on]
  );
  return (
    <Tooltip
      overlayClassName={styles["error-tooltip"]}
      title={error?.message}
      visible={showTooltip}
    >
      {children && children(handlers)}
    </Tooltip>
  );
};

export default ErrorTooltip;
