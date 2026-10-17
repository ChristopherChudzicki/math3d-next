import { WidgetType } from "@math3d/mathitem-configs";
import React from "react";

import AutosizeText from "./AutosizeText";
import ColorWidget from "./ColorWidget";
import MathAssignment from "./MathAssignment";
import MathBoolean from "./MathBoolean";
import MathValue from "./MathValue";
import TextInput from "./TextInput";
import { IWidgetProps } from "./types";
import ErrorTooltip from "./ErrorTooltip";

type WidgetProps = IWidgetProps & {
  // This seems like a false positive
  // eslint-disable-next-line react/no-unused-prop-types
  widget: WidgetType;
};

const getWidgetComponent = ({ widget, ...props }: WidgetProps) => {
  if (widget === WidgetType.MathValue) return <MathValue {...props} />;
  if (widget === WidgetType.MathBoolean) return <MathBoolean {...props} />;
  if (widget === WidgetType.Color) return <ColorWidget {...props} />;
  if (widget === WidgetType.AutosizeText) return <AutosizeText {...props} />;
  if (widget === WidgetType.Text) return <TextInput {...props} />;
  throw new Error(`Unrecognized form widget`);
};

const FieldWidget: React.FC<WidgetProps> = (props) => {
  const widgetComponent = getWidgetComponent(props);
  return <ErrorTooltip error={props.error}>{widgetComponent}</ErrorTooltip>;
};

export default FieldWidget;

export { useOnWidgetChange, usePatchPropertyOnChange } from "./hooks";
export { MathAssignment };
export type { WidgetProps };
