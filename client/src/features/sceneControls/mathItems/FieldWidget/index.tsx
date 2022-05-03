import React, { useCallback } from 'react'
import { MathItems, MathItemType as MIT, Widget } from 'types'
import { useAppDispatch } from "app/hooks";
import { actions } from '../mathItems.slice'

interface IWidgetProps {
  name: string
  value: string
  onChange: OnWidgetChange
  style?: React.CSSProperties
  className?: string
}

export interface WidgetChangeEvent {
  name: string;
  value: string
}
export type OnWidgetChange = (e: WidgetChangeEvent) => void

const PlaceholderInput: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { onChange, name, ...others } = props
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    const event: WidgetChangeEvent = { name, value: e.target.value }
    onChange(event)
  }, [onChange, name])
  return <input name={name} onChange={onInputChange} {...others} />
};

const MathValue = PlaceholderInput;

const MathBoolean = PlaceholderInput;

const ColorPicker = PlaceholderInput;

const AutosizeText = PlaceholderInput;

type WidgetsProps = {
  [Widget.MathValue]: React.ComponentProps<typeof MathValue>;
  [Widget.Color]: React.ComponentProps<typeof ColorPicker>
  [Widget.MathBoolean]: React.ComponentProps<typeof MathBoolean>
  [Widget.AutosizeText]: React.ComponentProps<typeof AutosizeText>
}

type FormWidgetProps<W extends Widget> = {
  widget: W
} & WidgetsProps[W]

const getComponentForWidget = (widget: Widget) => {
  if (widget === Widget.MathValue) return MathValue;
  if (widget === Widget.MathBoolean) return MathBoolean;
  if (widget === Widget.Color) return ColorPicker;
  if (widget === Widget.AutosizeText) return AutosizeText;
  throw new Error(`Unrecognized form widget: ${widget}`);
};

const FieldWidget = <W extends Widget,>(props: FormWidgetProps<W>): JSX.Element => {
  const { widget, ...otherProps } = props;
  const WidgetComponent = getComponentForWidget(widget);
  return <WidgetComponent {...otherProps} />;
};

export {
  MathValue,
  MathBoolean,
  ColorPicker,
  AutosizeText
}

export default FieldWidget;


export const useDispatchSetPropertyFromWidget = <T extends MIT>(item: MathItems[T]) => {
  const dispatch = useAppDispatch()
  const dispatchSetProperty: OnWidgetChange = useCallback(
    (e) => {
      const properties = { [e.name]: e.value };
      const patch = { id: item.id, type: item.type, properties };
      dispatch(actions.setProperties(patch));
    },
    [dispatch, item.id, item.type]
  );
  return dispatchSetProperty
}