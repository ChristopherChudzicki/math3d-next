import React from "react";
import { Widget } from "types/mathItem";

const PlaceholderInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = (props) => <input {...props} />;

const MathValue = PlaceholderInput;

const MathBoolean = PlaceholderInput;

const ColorPicker = PlaceholderInput;

const AutosizeText = PlaceholderInput;

type FormWidgetProps = React.InputHTMLAttributes<HTMLInputElement> & {
  widget: Widget;
};

const getComponentForWidget = (widget: Widget) => {
  if (widget === Widget.MathValue) return MathValue;
  if (widget === Widget.MathBoolean) return MathBoolean;
  if (widget === Widget.Color) return ColorPicker;
  if (widget === Widget.AutosizeText) return AutosizeText;
  throw new Error(`Unrecognized form widget: ${widget}`);
};

const FieldWidget: React.FC<FormWidgetProps> = (props) => {
  const { widget, ...otherProps } = props;
  const WidgetComponent = getComponentForWidget(widget);
  return <WidgetComponent {...otherProps} />;
};

export default FieldWidget;
