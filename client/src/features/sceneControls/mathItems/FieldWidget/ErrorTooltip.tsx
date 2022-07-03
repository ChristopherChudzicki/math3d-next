import React, { useCallback, useRef } from "react";
import { Tooltip } from "antd";
import { useToggle } from "util/hooks";
import styles from "./ErrorTooltip.module.css";

interface Props {
  error?: Error;
  children?: React.ReactNode;
}

const ErrorTooltip: React.FC<Props> = ({ error, children }) => {
  const container = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useToggle(false);
  const showTooltip = isFocused && !!error?.message;
  const getPopupContainer = useCallback(() => {
    if (!container.current) {
      throw new Error("Container ref should not be null");
    }
    return container.current;
  }, []);
  return (
    <div
      className="position-relative"
      ref={container}
      onFocus={setIsFocused.on}
      onBlur={setIsFocused.off}
    >
      <Tooltip
        getPopupContainer={getPopupContainer}
        overlayClassName={styles["error-tooltip"]}
        title={error?.message}
        visible={showTooltip}
      >
        {children}
      </Tooltip>
    </div>
  );
};

export default ErrorTooltip;
