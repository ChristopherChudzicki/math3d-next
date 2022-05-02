import React from "react";
import mergeClassNames from "classnames";
import type { MathItem, MathItemConfig, MathItemType as MIT } from "types";
import styles from "./ItemTemplate.module.css";
import SettingsPopover from "./SettingsPopover";
import CloseButton from "./CloseButton";

type Props = {
  showAlignmentBar?: boolean;
  item: MathItem;
  config: MathItemConfig;
};

const ItemTemplate: React.FC<Props> = ({
  item,
  config,
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
    <div className={styles["grid-center-top"]}>
      {item.properties.description}
    </div>
    <div className={styles["grid-center-bottom"]}>Content</div>
    <div
      className={mergeClassNames(
        styles["grid-right-gutter-top"],
        "d-flex",
        "justify-content-end"
      )}
    >
      <CloseButton />
    </div>
    <div className={styles["grid-right-gutter-bottom"]}>
      <SettingsPopover item={item} config={config} />
    </div>
  </div>
);

export default ItemTemplate;
