import {
  MathItemType as MIT,
  Point,
  MathItemConfig,
  Widget,
  MathItemGenerator,
} from "types";

const defaultValues: Point["properties"] = {
  coords: "[0, 0, 0]",
  description: "Point",
  size: "8",
  visible: "true",
  color: "#3090ff",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  label: "",
  labelVisible: "false",
};

export const make: MathItemGenerator<MIT.Point> = (id) => ({
  id,
  type: MIT.Point,
  properties: { ...defaultValues },
});

const config: MathItemConfig = {
  type: MIT.Point,
  label: "Point",
  properties: [
    {
      name: "coords",
      label: "Coordinates",
      defaultValue: defaultValues.coords,
      widget: Widget.MathValue,
      primaryOnly: true,
    },
    {
      name: "description",
      label: "Description",
      defaultValue: defaultValues.description,
      widget: Widget.AutosizeText,
      primaryOnly: true,
    },
    {
      name: "size",
      label: "Size",
      defaultValue: defaultValues.size,
      widget: Widget.MathValue,
    },
    {
      name: "visible",
      label: "Visible",
      defaultValue: defaultValues.visible,
      widget: Widget.MathBoolean,
    },
    {
      name: "color",
      label: "Color",
      defaultValue: defaultValues.color,
      widget: Widget.Color,
    },
    {
      name: "opacity",
      label: "Opacity",
      defaultValue: defaultValues.opacity,
      widget: Widget.MathValue,
    },
    {
      name: "zIndex",
      label: "Z-Index",
      defaultValue: defaultValues.zIndex,
      widget: Widget.MathValue,
    },
    {
      name: "zBias",
      label: "Z-Bias",
      defaultValue: defaultValues.zBias,
      widget: Widget.MathValue,
    },
    {
      name: "label",
      label: "Label",
      defaultValue: defaultValues.label,
      widget: Widget.Text,
    },
    {
      name: "labelVisible",
      label: "Label Visibility",
      defaultValue: defaultValues.labelVisible,
      widget: Widget.MathBoolean,
    },
  ],
};

export { config, defaultValues };
