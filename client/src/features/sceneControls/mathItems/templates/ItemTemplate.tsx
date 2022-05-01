import React from "react";
import mergeClassNames from "classnames";
import styles from "./ItemTemplate.module.css";
import type { MathItemConfig } from '../configs'
import SettingsPopover from './SettingsPopover'

type Props = {
  showAlignmentBar?: boolean;
  description: string;
  config: MathItemConfig;
};

const ItemTemplate: React.FC<Props> = ({
  description,
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
    <div className={styles["grid-center-top"]}>{description}</div>
    <div className={styles["grid-center-bottom"]}>
      Content
    </div>
    <div className={styles["grid-right-gutter-top"]}>X</div>
    <div className={styles["grid-right-gutter-bottom"]} >
    <SettingsPopover config={config} />
    </div>
  </div>
  )

export default ItemTemplate;
