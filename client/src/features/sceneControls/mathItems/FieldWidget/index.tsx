import { MathItem, MathItemType as MIT, WidgetType } from "@/configs";
import React, { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";

import { actions } from "../mathItemsSlice";
import AutosizeText from "./AutosizeText";
import ColorWidget from "./ColorWidget";
import MathAssignment from "./MathAssignment";
import MathBoolean from "./MathBoolean";
import MathValue from "./MathValue";
import TextInput from "./TextInput";
import { OnWidgetChange } from "./types";
import ErrorTooltip from "./ErrorTooltip";

type WidgetsProps = {
  [WidgetType.MathValue]: React.ComponentProps<typeof MathValue>;
  [WidgetType.Color]: React.ComponentProps<typeof ColorWidget>;
  [WidgetType.MathBoolean]: React.ComponentProps<typeof MathBoolean>;
  [WidgetType.AutosizeText]: React.ComponentProps<typeof AutosizeText>;
  [WidgetType.MathAssignment]: React.ComponentProps<typeof MathAssignment>;
  [WidgetType.Text]: React.ComponentProps<typeof TextInput>;
  [WidgetType.Custom]: never;
};

type FormWidgetProps<W extends WidgetType> = {
  widget: W;
} & WidgetsProps[W];

const getComponentForWidget = (widget: WidgetType) => {
  if (widget === WidgetType.MathValue) return MathValue;
  if (widget === WidgetType.MathBoolean) return MathBoolean;
  if (widget === WidgetType.Color) return ColorWidget;
  if (widget === WidgetType.AutosizeText) return AutosizeText;
  if (widget === WidgetType.Text) return TextInput;
  if (widget === WidgetType.Custom) {
    throw new Error(`Cannot get component for custom widget.`);
  }
  if (widget === WidgetType.MathAssignment) {
    throw new Error(`MathAssignment must be called directly`);
  }
  throw new Error(`Unrecognized form widget: ${widget}`);
};

const FieldWidget = <W extends WidgetType>(
  props: FormWidgetProps<W>
): JSX.Element => {
  const { widget, ...otherProps } = props;
  const WidgetComponent = getComponentForWidget(widget);
  return (
    <ErrorTooltip error={props.error}>
      <WidgetComponent {...otherProps} />
    </ErrorTooltip>
  );
};

export default FieldWidget;
/**
 * The returned event handler will:
 *  1. set the property value on given `item` in redux store
 *  2. if the WidgetChangeEvent event has a MathScope object, will set
 *    the expression on mathScope with id `itemId-propName`.
 */
export const useOnWidgetChange = <T extends MIT>(item: MathItem<T>) => {
  const dispatch = useAppDispatch();
  const onWidgetChange: OnWidgetChange = useCallback(
    (e) => {
      const properties = { [e.name]: e.value };
      const patch = { id: item.id, properties, type: item.type };
      dispatch(actions.setProperties(patch));
    },
    [dispatch, item.id, item.type]
  );
  return onWidgetChange;
};

export { MathAssignment };
