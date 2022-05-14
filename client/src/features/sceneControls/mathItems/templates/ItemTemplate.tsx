import React, { useCallback } from "react";
import mergeClassNames from "classnames";
import type { MathItem, MathItemConfig } from "types";
import { useAppDispatch } from "app/hooks";
import styles from "./ItemTemplate.module.css";
import SettingsPopover from "./SettingsPopover";
import CloseButton from "./CloseButton";
import { AutosizeText, useOnWidgetChange } from "../FieldWidget";
import { usePopulateMathScope } from "../mathScope";
import { actions } from "../mathItems.slice";

type Props = {
  showAlignmentBar?: boolean;
  item: MathItem;
  config: MathItemConfig;
  children?: React.ReactNode;
};

const ItemTemplate: React.FC<Props> = ({
  item,
  config,
  children,
  showAlignmentBar = true,
}) => {
  const onWidgetChange = useOnWidgetChange(item);
  usePopulateMathScope(item, config);
  const dispatch = useAppDispatch();
  const remove = useCallback(() => {
    dispatch(actions.remove({ id: item.id }));
  }, [dispatch, item.id]);
  return (
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
        <AutosizeText
          name="description"
          value={item.properties.description}
          onChange={onWidgetChange}
        />
      </div>
      <div className={styles["grid-center-bottom"]}>{children}</div>
      <div
        className={mergeClassNames(
          styles["grid-right-gutter-top"],
          "d-flex",
          "justify-content-end"
        )}
      >
        <CloseButton onClick={remove} />
      </div>
      <div className={styles["grid-right-gutter-bottom"]}>
        <SettingsPopover item={item} config={config} />
      </div>
    </div>
  );
};

export default ItemTemplate;
