import React from "react";
import { useToggle } from "@/util/hooks";
// import { Popover } from "@/util/components";
import Tooltip from "@mui/material/Tooltip";
import styles from "./ErrorTooltip.module.css";

interface Props {
  error?: Error;
  children: React.ReactElement;
}

const ErrorTooltip: React.FC<Props> = ({ error, children }) => {
  const [isFocused, setIsFocused] = useToggle(false);
  const showTooltip = isFocused && !!error?.message;
  return (
    <Tooltip
      title={
        error?.message ? (
          <div className={styles["error-tooltip"]}>{error?.message}</div>
        ) : (
          ""
        )
      }
      open={showTooltip}
    >
      {React.cloneElement(children, {
        onBlur: setIsFocused.off,
        onFocus: setIsFocused.on,
      })}
    </Tooltip>
  );
};

export default ErrorTooltip;
