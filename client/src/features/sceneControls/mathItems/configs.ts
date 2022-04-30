export interface MathItemConfig {
  type: string;
  properties: PropertyConfig[];
}

enum Widget {
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
}


export const PointConfig: MathItemConfig = {
  type: "POINT",
  properties: [
    {
      name: "coords",
      defaultValue: "\\[0, 0, 0\\]",
      widget: Widget.MathValue,
      primaryOnly: true
    },
    {
      name: "description",
      defaultValue: "",
      widget: Widget.MathValue,
      primaryOnly: true
    },
    {
      name: "size",
      defaultValue: "8",
      widget: Widget.MathValue
    },
    {
      name: "visible",
      defaultValue: "true",
      widget: Widget.MathBoolean
    },
    {
      name: "color",
      defaultValue: "#3090ff",
      widget: Widget.Color
    },
    {
      name: "opacity",
      defaultValue: "1",
      widget: Widget.MathValue
    },
    {
      name: "zIndex",
      defaultValue: "0",
      widget: Widget.MathValue
    },
    {
      name: "zBias",
      defaultValue: "0",
      widget: Widget.MathValue
    },
    {
      name: "label",
      defaultValue: "",
      widget: Widget.MathValue
    },
    {
      name: "labelVisible",
      defaultValue: "",
      widget: Widget.MathBoolean
    }
  ]
};
