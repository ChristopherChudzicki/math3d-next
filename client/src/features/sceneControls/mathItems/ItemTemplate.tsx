import React from "react";
import mergeClassNames from "classnames";
import styles from "./ItemTemplate.module.css";

type Props = {
  showAlignmentBar?: boolean;
  description: string;
};

const ItemTemplate: React.FC<Props> = ({
  description,
  showAlignmentBar = true,
}) => (
  <div className={styles.container}>
    <div
      className={mergeClassNames(
        styles["grid-left-gutter"],
        styles["left-gutter"]
      )}
    >
      {showAlignmentBar && <div className={styles["vertical-line"]} />}
    </div>
    <div className={styles["grid-center-top"]}>{description}</div>
    <div className={styles["grid-center-bottom"]}>content</div>
    <div className={styles["grid-right-gutter-top"]}>X</div>
    <div className={styles["grid-right-gutter-bottom"]} />
  </div>
);

export default ItemTemplate;
