import mergeClassNames from "classnames";
import {
  isMathGraphic,
  MathItem,
  MathItemConfig,
  MathItemType as MIT,
  WidgetType,
} from "configs";
import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

import ColorStatus from "../ColorStatus";
import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { actions as mathItemActions } from "../mathItems.slice";
import {
  actions as itemOrderActions,
  selectIsActive,
} from "../itemOrder.slice";
import { usePopulateMathScope } from "../mathScope";
import { testId } from "../util";
import CloseButton from "./CloseButton";
import styles from "./ItemTemplate.module.css";
import SettingsPopover from "./SettingsPopover";

type Props<T extends MIT> = {
  showAlignmentBar?: boolean;
  sideContent?: React.ReactNode;
  item: MathItem<T>;
  config: MathItemConfig<T>;
  children?: React.ReactNode;
};

const ItemTemplate = <T extends MIT>({
  item,
  config,
  children,
  sideContent,
  showAlignmentBar = true,
}: Props<T>) => {
  const onWidgetChange = useOnWidgetChange(item);
  usePopulateMathScope(item, config);
  const dispatch = useAppDispatch();
  const isActive = useAppSelector(selectIsActive(item.id));
  const remove = useCallback(() => {
    dispatch(mathItemActions.remove({ id: item.id }));
  }, [dispatch, item.id]);

  const onFocus = useCallback(() => {
    dispatch(itemOrderActions.setActiveItem({ id: item.id }));
  }, [item.id, dispatch]);

  return (
    <div
      className={styles.container}
      data-testid={testId(item.id)}
      onFocus={onFocus}
    >
      <div
        className={mergeClassNames(
          styles["grid-left-gutter"],
          styles["left-gutter"],
          "position-relative",
          "d-flex",
          {
            [styles["item-active"]]: isActive,
          }
        )}
      >
        {showAlignmentBar && <div className={styles["vertical-line"]} />}
        {sideContent}
        {isMathGraphic(item) && <ColorStatus item={item} />}
      </div>
      <div className={styles["grid-center-top"]}>
        <FieldWidget
          widget={WidgetType.AutosizeText}
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
        <CloseButton
          disabled={item.type === MIT.Folder}
          onClick={remove}
          aria-label="Remove Item"
        />
      </div>
      <div className={styles["grid-right-gutter-bottom"]}>
        {config.settingsProperties.length > 0 && (
          <SettingsPopover item={item} config={config} />
        )}
      </div>
    </div>
  );
};

export default ItemTemplate;
