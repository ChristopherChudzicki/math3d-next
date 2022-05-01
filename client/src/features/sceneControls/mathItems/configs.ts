export interface MathItemConfig {
  type: string;
  label: "Point";
  properties: PropertyConfig[];
}

export enum Widget {
  MathBoolean = 'math-boolean',
  MathValue = 'math-value',
  Color = 'color-picker',
}


type PropertyValue = string | number | boolean | null;

interface PropertyConfig {
  readonly name: string
  readonly defaultValue: PropertyValue
  readonly widget: Widget
  readonly primaryOnly?: boolean
  readonly label: string
}


export const PointConfig: MathItemConfig = {
  type: "POINT",
  label: "Point",
  properties: [
    {
      name: "coords",
      label: 'Coordinates',
      defaultValue: "\\[0, 0, 0\\]",
      widget: Widget.MathValue,
      primaryOnly: true
    },
    {
      name: "description",
      label: 'Description',
      defaultValue: "",
      widget: Widget.MathValue,
      primaryOnly: true
    },
    {
      name: "size",
      label: 'Size',
      defaultValue: "8",
      widget: Widget.MathValue
    },
    {
      name: "visible",
      label: 'Visible',
      defaultValue: "true",
      widget: Widget.MathBoolean
    },
    {
      name: "color",
      label: 'Color',
      defaultValue: "#3090ff",
      widget: Widget.Color
    },
    {
      name: "opacity",
      label: 'Opacity',
      defaultValue: "1",
      widget: Widget.MathValue
    },
    {
      name: "zIndex",
      label: 'Z-Index',
      defaultValue: "0",
      widget: Widget.MathValue
    },
    {
      name: "zBias",
      label: 'Z-Bias',
      defaultValue: "0",
      widget: Widget.MathValue
    },
    {
      name: "label",
      label: 'Label',
      defaultValue: "",
      widget: Widget.MathValue
    },
    {
      name: "labelVisible",
      label: 'Label Visibility',
      defaultValue: "",
      widget: Widget.MathBoolean
    }
  ]
};
