import React from "react";
import mergeClassNames from "classnames";
import styles from "./ItemTemplate.module.css";

type Props = {
  showAlignmentBar?: boolean;
  description: string;
};
const defaultProps = {
  showAlignmentBar: true,
};

const ItemTemplate: React.FC<Props> = (props) => {
  const allProps = { ...props, ...defaultProps };
  const { showAlignmentBar } = allProps;
  return (
    <div className={styles["container"]}>
      <div
        className={mergeClassNames(
          styles["grid-left-gutter"],
          styles["left-gutter"]
        )}
      >
        {showAlignmentBar && <div className={styles["vertical-line"]} />}
      </div>
      <div className={styles["grid-center-top"]}>{allProps.description}</div>
      <div className={styles["grid-center-bottom"]}>content</div>
      <div className={styles["grid-right-gutter-top"]}>X</div>
      <div className={styles["grid-right-gutter-bottom"]}></div>
    </div>
  );
};

export default ItemTemplate;
