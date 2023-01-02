import CloseIcon from "@mui/icons-material/Close";
import mergeClassNames from "classnames";
import React from "react";
import SubtleButton, {
  SubtleButtonProps,
} from "@/util/components/SubtleButton";

import styles from "./CloseButton.module.css";

const CloseButton: React.FC<SubtleButtonProps> = (props) => {
  const className = mergeClassNames(props.className, styles["close-button"]);
  return (
    <SubtleButton {...props} className={className} centered>
      <CloseIcon />
    </SubtleButton>
  );
};

export default CloseButton;
