import React from "react";
import { useToggle } from "@/util/hooks";
import { Popover } from "@/util/components";
import styles from "./ErrorTooltip.module.css";

interface Props {
  error?: Error;
  children?: React.ReactNode;
}

const ErrorTooltip: React.FC<Props> = ({ error, children }) => {
  const [isFocused, setIsFocused] = useToggle(false);
  const showTooltip = isFocused && !!error?.message;
  return (
    <Popover
      className={styles["error-tooltip"]}
      trigger={
        <div
          className="position-relative"
          onFocus={setIsFocused.on}
          onBlur={setIsFocused.off}
        >
          {children}
        </div>
      }
      visible={showTooltip}
    >
      {error?.message}
    </Popover>
  );
};

export default ErrorTooltip;
