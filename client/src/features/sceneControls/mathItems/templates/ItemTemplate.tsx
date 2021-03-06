import classNames from "classnames";
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
import { actions, select } from "../mathItemsSlice";
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

  const dispatch = useAppDispatch();
  const isActive = useAppSelector(select.isActive(item.id));
  const remove = useCallback(() => {
    dispatch(actions.remove({ id: item.id }));
  }, [dispatch, item.id]);

  const onFocus = useCallback(() => {
    dispatch(actions.setActiveItem({ id: item.id }));
  }, [item.id, dispatch]);

  return (
    <form
      title={`Settings for ${item.properties.description}`}
      className={styles.container}
      data-testid={testId(item.id)}
      onFocus={onFocus}
    >
      <div
        className={classNames(
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
        className={classNames(
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
    </form>
  );
};

export default ItemTemplate;
