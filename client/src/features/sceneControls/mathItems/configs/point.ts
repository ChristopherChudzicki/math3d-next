import { MathItemType, MathItemConfig, Widget } from "types";

const config: MathItemConfig = {
  type: MathItemType.Point,
  label: "Point",
  properties: [
    {
      name: "coords",
      label: "Coordinates",
      defaultValue: "\\[0, 0, 0\\]",
      widget: Widget.MathValue,
      primaryOnly: true,
    },
    {
      name: "description",
      label: "Description",
      defaultValue: "",
      widget: Widget.AutosizeText,
      primaryOnly: true,
    },
    {
      name: "size",
      label: "Size",
      defaultValue: "8",
      widget: Widget.MathValue,
    },
    {
      name: "visible",
      label: "Visible",
      defaultValue: "true",
      widget: Widget.MathBoolean,
    },
    {
      name: "color",
      label: "Color",
      defaultValue: "#3090ff",
      widget: Widget.Color,
    },
    {
      name: "opacity",
      label: "Opacity",
      defaultValue: "1",
      widget: Widget.MathValue,
    },
    {
      name: "zIndex",
      label: "Z-Index",
      defaultValue: "0",
      widget: Widget.MathValue,
    },
    {
      name: "zBias",
      label: "Z-Bias",
      defaultValue: "0",
      widget: Widget.MathValue,
    },
    {
      name: "label",
      label: "Label",
      defaultValue: "",
      widget: Widget.MathValue,
    },
    {
      name: "labelVisible",
      label: "Label Visibility",
      defaultValue: "",
      widget: Widget.MathBoolean,
    },
  ],
};

export default config;
