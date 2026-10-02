import CloseIcon from "@mui/icons-material/Close";
import classNames from "classnames";
import React from "react";
import IconButton from "@/ui/IconButton";
import type { IconButtonProps } from "@/ui/IconButton";

import styles from "./CloseButton.module.css";

type CloseButtonProps = Omit<IconButtonProps, "children">;

const CloseButton: React.FC<CloseButtonProps> = ({ className, ...others }) => (
  <IconButton
    size="sm"
    {...others}
    className={classNames(styles["close-button"], className)}
  >
    <CloseIcon fontSize="inherit" />
  </IconButton>
);

export default CloseButton;
