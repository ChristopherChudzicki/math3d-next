import React, { useCallback } from "react";
import {
  MathItem,
  MathItemType as MIT,
  WidgetType,
  mathItemConfigs,
  PropertyConfig,
} from "configs";
import { useAppDispatch } from "store/hooks";
import { assertNotNil } from "util/predicates";
import { actions } from "../mathItems.slice";
import { OnWidgetChange } from "./types";
import { mathScopeId } from "../mathScope";
import MathValue from "./MathValue";
import MathBoolean from "./MathBoolean";
import MathAssignment from "./MathAssignment";
import AutosizeText from "./AutosizeText";
import TextInput from "./TextInput";
import ColorWidget from "./ColorWidget";

type WidgetsProps = {
  [WidgetType.MathValue]: React.ComponentProps<typeof MathValue>;
  [WidgetType.Color]: React.ComponentProps<typeof ColorWidget>;
  [WidgetType.MathBoolean]: React.ComponentProps<typeof MathBoolean>;
  [WidgetType.AutosizeText]: React.ComponentProps<typeof AutosizeText>;
  [WidgetType.MathAssignment]: React.ComponentProps<typeof MathAssignment>;
  [WidgetType.Text]: React.ComponentProps<typeof TextInput>;
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
  throw new Error(`Unrecognized form widget: ${widget}`);
};

const FieldWidget = <W extends WidgetType>(
  props: FormWidgetProps<W>
): JSX.Element => {
  const { widget, ...otherProps } = props;
  const WidgetComponent = getComponentForWidget(widget);
  return <WidgetComponent {...otherProps} />;
};

export { MathValue, MathBoolean, AutosizeText };

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
      const patch = { id: item.id, properties };
      dispatch(actions.setProperties(patch));
      if (e.mathScope) {
        const config = mathItemConfigs[item.type];
        // @ts-expect-error ... string can't index config.properties
        const propConfig: PropertyConfig<string> = config.properties[e.name];
        assertNotNil(propConfig, "Property config should not be nil.");
        e.mathScope.setExpressions([
          {
            id: mathScopeId(item.id, e.name),
            expr: e.value,
            parseOptions: {
              validate: propConfig.validate,
            },
          },
        ]);
      }
    },
    [dispatch, item.id, item.type]
  );
  return onWidgetChange;
};

export { MathAssignment };
