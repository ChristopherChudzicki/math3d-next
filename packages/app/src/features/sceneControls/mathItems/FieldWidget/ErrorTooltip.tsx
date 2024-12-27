import React from "react";
import { useToggle } from "@/util/hooks";
// import { Popover } from "@/util/components";
import Tooltip from "@mui/material/Tooltip";

interface Props {
  error?: Error;
  children: React.ReactElement;
}

const ErrorTooltip: React.FC<Props> = ({ error, children }) => {
  const [isFocused, setIsFocused] = useToggle(false);
  const showTooltip = isFocused && !!error?.message;
  return (
    <Tooltip
      describeChild
      title={error?.message ? <div>{error?.message}</div> : ""}
      open={showTooltip}
    >
      <span onBlur={setIsFocused.off} onFocus={setIsFocused.on}>
        {children}
      </span>
    </Tooltip>
  );
};

export default ErrorTooltip;
