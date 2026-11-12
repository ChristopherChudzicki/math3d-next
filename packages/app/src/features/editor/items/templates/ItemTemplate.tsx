import classNames from "classnames";
import {
  isMathGraphic,
  MathItem,
  MathItemConfig,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import * as u from "@/util/styles/utils.module.css";
import ColorStatus from "@/features/editor/items/ColorStatus";
import FieldWidget, {
  useOnWidgetChange,
} from "@/features/editor/items/FieldWidget";
import { actions } from "@/store/scene/state/scene.slice";
import * as select from "@/store/scene/state/selectors";
import CloseButton from "./CloseButton";
import styles from "./ItemTemplate.module.css";
import SettingsPopover from "./SettingsPopover";

/**
 * Keeps math-field focus when a control in a widened item is pressed; otherwise
 * the item narrows and the control slides out from under the pointer.
 */
const keepMathFocus: React.MouseEventHandler<HTMLFormElement> = (e) => {
  const form = e.currentTarget;
  if (
    e.target instanceof Element &&
    // Base UI renders Switch and Checkbox as spans.
    e.target.closest("button, [role=switch], [role=checkbox]") &&
    // A narrow form is its sizer's width minus its 2px of side margins.
    form.offsetWidth > (form.parentElement?.clientWidth ?? Infinity)
  ) {
    e.preventDefault();
  }
};

type Props<T extends MIT> = {
  showAlignmentBar?: boolean;
  sideContent?: React.ReactNode;
  item: MathItem<T>;
  config: MathItemConfig<T>;
  children?: React.ReactNode;
  childItem?: boolean;
};

const ItemTemplate = <T extends MIT>({
  item,
  config,
  children,
  sideContent,
  showAlignmentBar = true,
  childItem = true,
}: Props<T>) => {
  const onWidgetChange = useOnWidgetChange(item);

  const dispatch = useAppDispatch();
  const isActive = useAppSelector(select.isActive(item.id));
  const hasChildren = useAppSelector(select.hasChildren(item.id));
  const remove = useCallback(() => {
    dispatch(actions.remove({ id: item.id }));
  }, [dispatch, item.id]);

  const onFocus = useCallback(() => {
    dispatch(actions.setActiveItem({ id: item.id }));
  }, [item.id, dispatch]);

  const permanent = useAppSelector(select.isPermanent(item.id));

  return (
    <div className={styles.sizer}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onMouseDown only keeps focus for the buttons inside */}
      <form
        data-testid={`settings-${item.id}`}
        aria-label={`Settings for ${item.properties.description}`}
        className={classNames(styles.container, {
          [styles.childItem]: childItem,
        })}
        onFocus={onFocus}
        onMouseDown={keepMathFocus}
      >
        <div
          className={classNames(
            styles["grid-left-gutter"],
            styles["left-gutter"],
            u.positionRelative,
            u.dFlex,
            {
              [styles["item-active"]]: isActive,
            },
          )}
        >
          {showAlignmentBar && <div className={styles["vertical-line"]} />}
          {sideContent}
          {isMathGraphic(item) && <ColorStatus item={item} />}
        </div>
        <div className={styles["grid-center-top"]}>
          <FieldWidget
            widget={WidgetType.AutosizeText}
            label={config.properties.description.label}
            name="description"
            value={item.properties.description}
            onChange={onWidgetChange}
            className={styles.description}
          />
        </div>
        <div className={styles["grid-center-bottom"]}>{children}</div>
        <div
          className={classNames(
            styles["grid-right-gutter-top"],
            u.dFlex,
            u.justifyContentEnd,
          )}
        >
          <CloseButton
            disabled={permanent || hasChildren}
            className={classNames({
              [styles.hidden]: permanent,
            })}
            onClick={remove}
            label="Remove Item"
          />
        </div>
        <div
          className={classNames(
            styles["grid-right-gutter-bottom"],
            u.dFlex,
            u.justifyContentEnd,
          )}
        >
          {config.settingsProperties.length > 0 && (
            <SettingsPopover item={item} config={config} />
          )}
        </div>
      </form>
    </div>
  );
};

export default ItemTemplate;
