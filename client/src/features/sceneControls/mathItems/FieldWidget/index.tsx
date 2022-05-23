import React, { useCallback, useContext } from "react";
import classNames from "classnames";
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
import MathEqualityInput from "./MathEqualityInput";
import { IWidgetProps, WidgetChangeEvent, OnWidgetChange } from "./types";
import { MathContext, mathScopeId } from "../mathScope";
import styles from "./widget.module.css";

const PlaceholderInput: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const mathScope = useContext(MathContext);
  const { onChange, name, title, error, ...others } = props;
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const event: WidgetChangeEvent = {
        name,
        value: e.target.value,
        mathScope,
      };
      onChange(event);
    },
    [onChange, name, mathScope]
  );
  return (
    <input
      title={title}
      className={classNames({
        [styles["has-error"]]: error,
      })}
      name={name}
      onChange={onInputChange}
      {...others}
    />
  );
};

const MathValue = PlaceholderInput;

const MathBoolean = PlaceholderInput;

const ColorPicker = PlaceholderInput;

const AutosizeText = PlaceholderInput;

const TextInput = PlaceholderInput;

type WidgetsProps = {
  [WidgetType.MathValue]: React.ComponentProps<typeof MathValue>;
  [WidgetType.Color]: React.ComponentProps<typeof ColorPicker>;
  [WidgetType.MathBoolean]: React.ComponentProps<typeof MathBoolean>;
  [WidgetType.AutosizeText]: React.ComponentProps<typeof AutosizeText>;
  [WidgetType.MathEquality]: React.ComponentProps<typeof MathEqualityInput>;
  [WidgetType.Text]: React.ComponentProps<typeof TextInput>;
};

type FormWidgetProps<W extends WidgetType> = {
  widget: W;
} & WidgetsProps[W];

const getComponentForWidget = (widget: WidgetType) => {
  if (widget === WidgetType.MathValue) return MathValue;
  if (widget === WidgetType.MathBoolean) return MathBoolean;
  if (widget === WidgetType.Color) return ColorPicker;
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

export { MathValue, MathBoolean, ColorPicker, AutosizeText };

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
      const patch = { id: item.id, type: item.type, properties };
      dispatch(actions.setProperties(patch));
      if (e.mathScope) {
        const config = mathItemConfigs[item.type];
        // @ts-expect-error ... string can't index config.properties
        const propConfig: PropertyConfig<string> = config.properties[e.name];
        console.log(e);
        console.log(config);
        assertNotNil(propConfig);
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

export { MathEqualityInput };
