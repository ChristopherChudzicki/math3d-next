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
import { OnWidgetChange, Parseable } from "./types";
import ErrorTooltip from "./ErrorTooltip";

type WidgetsProps = {
  [WidgetType.MathValue]: React.ComponentProps<typeof MathValue>;
  [WidgetType.Color]: React.ComponentProps<typeof ColorWidget>;
  [WidgetType.MathBoolean]: React.ComponentProps<typeof MathBoolean>;
  [WidgetType.AutosizeText]: React.ComponentProps<typeof AutosizeText>;
  [WidgetType.MathAssignment]: React.ComponentProps<typeof MathAssignment>;
  [WidgetType.Text]: React.ComponentProps<typeof TextInput>;
  [WidgetType.Custom]: never;
  [WidgetType.CustomMath]: never;
};

type WidgetsAndWidgetsProps = {
  [W in keyof WidgetsProps]: WidgetsProps[W] & { widget: W };
};
type WidgetProps = WidgetsAndWidgetsProps[keyof WidgetsAndWidgetsProps];

const getWidgetComponent = (props: WidgetProps) => {
  if (props.widget === WidgetType.MathValue) return <MathValue {...props} />;
  if (props.widget === WidgetType.MathBoolean)
    return <MathBoolean {...props} />;
  if (props.widget === WidgetType.Color) return <ColorWidget {...props} />;
  if (props.widget === WidgetType.AutosizeText)
    return <AutosizeText {...props} />;
  if (props.widget === WidgetType.Text) return <TextInput {...props} />;
  if (props.widget === WidgetType.MathAssignment)
    return <MathAssignment {...props} />;
  throw new Error(`Unrecognized form widget`);
};

const FieldWidget = (props: WidgetProps): JSX.Element => {
  const widgetComponent = getWidgetComponent(props);
  return <ErrorTooltip error={props.error}>{widgetComponent}</ErrorTooltip>;
};

export default FieldWidget;

export const useOnWidgetChange = <T extends MIT>(item: MathItem<T>) => {
  const dispatch = useAppDispatch();
  const onWidgetChange: OnWidgetChange<Parseable> = useCallback(
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
