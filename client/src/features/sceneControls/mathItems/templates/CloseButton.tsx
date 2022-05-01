import React from "react";
import mergeClassNames from "classnames";
import { CloseOutlined } from "@ant-design/icons";
import SubtleButton, { SubtleButtonProps } from "util/components/SubtleButton";
import styles from "./CloseButton.module.css";

const CloseButton: React.FC<SubtleButtonProps> = (props) => {
  const className = mergeClassNames(props.className, styles["close-button"]);
  return (
    <SubtleButton {...props} className={className}>
      <CloseOutlined />
    </SubtleButton>
  );
};

export default CloseButton;
