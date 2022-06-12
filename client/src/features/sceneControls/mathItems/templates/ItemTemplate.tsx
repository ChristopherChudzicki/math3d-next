import React, { useCallback } from "react";
import mergeClassNames from "classnames";
import {
  isMathGraphic,
  MathItem,
  MathItemConfig,
  MathItemType as MIT,
} from "configs";
import { useAppDispatch } from "store/hooks";
import styles from "./ItemTemplate.module.css";
import SettingsPopover from "./SettingsPopover";
import CloseButton from "./CloseButton";
import { AutosizeText, useOnWidgetChange } from "../FieldWidget";
import { actions } from "../mathItems.slice";
import { testId } from "../util";
import ColorStatus from "../ColorStatus";
import { usePopulateMathScope } from "../mathScope";

type Props<T extends MIT> = {
  showAlignmentBar?: boolean;
  item: MathItem<T>;
  config: MathItemConfig<T>;
  children?: React.ReactNode;
};

const ItemTemplate = <T extends MIT>({
  item,
  config,
  children,
  showAlignmentBar = true,
}: Props<T>) => {
  const onWidgetChange = useOnWidgetChange(item);
  usePopulateMathScope(item, config);
  const dispatch = useAppDispatch();
  const remove = useCallback(() => {
    dispatch(actions.remove({ id: item.id }));
  }, [dispatch, item.id]);

  return (
    <div className={styles.container} data-testid={testId(item.id)}>
      <div
        className={mergeClassNames(
          styles["grid-left-gutter"],
          styles["left-gutter"],
          "position-relative",
          "d-flex"
        )}
      >
        {showAlignmentBar && <div className={styles["vertical-line"]} />}
        {isMathGraphic(item) && <ColorStatus item={item} />}
      </div>
      <div className={styles["grid-center-top"]}>
        <AutosizeText
          title={config.properties.description.label}
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
        <CloseButton onClick={remove} aria-label="Remove Item" />
      </div>
      <div className={styles["grid-right-gutter-bottom"]}>
        <SettingsPopover item={item} config={config} />
      </div>
    </div>
  );
};

export default ItemTemplate;
